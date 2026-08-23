#!/usr/bin/env python3
"""Generate SevaSaathi QA Testing Checklist body PDF using ReportLab."""

import hashlib
import os
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import inch, mm
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.platypus import (
    Paragraph, Spacer, Table, TableStyle, PageBreak,
    KeepTogether, CondPageBreak, HRFlowable,
)
from reportlab.platypus.tableofcontents import TableOfContents
from reportlab.platypus import SimpleDocTemplate
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase.pdfmetrics import registerFontFamily

# ── Font Registration ──
FONT_DIR = '/usr/share/fonts'
pdfmetrics.registerFont(TTFont('Inter', f'{FONT_DIR}/truetype/english/Carlito-Regular.ttf'))
pdfmetrics.registerFont(TTFont('Inter-Bold', f'{FONT_DIR}/truetype/english/Carlito-Bold.ttf'))
pdfmetrics.registerFont(TTFont('Inter-Italic', f'{FONT_DIR}/truetype/english/Carlito-Italic.ttf'))
pdfmetrics.registerFont(TTFont('Inter-BoldItalic', f'{FONT_DIR}/truetype/english/Carlito-BoldItalic.ttf'))
registerFontFamily('Inter', normal='Inter', bold='Inter-Bold', italic='Inter-Italic', boldItalic='Inter-BoldItalic')

# ── Cascade Palette (SevaSaathi brand: Forest Green #14532d + Lime #a3e635) ──
PAGE_BG       = colors.HexColor('#f7f9f8')
SECTION_BG    = colors.HexColor('#eef2f0')
CARD_BG       = colors.HexColor('#e5ebe7')
TABLE_STRIPE  = colors.HexColor('#edf1ee')
HEADER_FILL   = colors.HexColor('#14532d')
COVER_BLOCK   = colors.HexColor('#1a6b3a')
BORDER_COLOR  = colors.HexColor('#b0c7b8')
ICON_COLOR    = colors.HexColor('#2d8b4e')
ACCENT        = colors.HexColor('#a3e635')
ACCENT_2      = colors.HexColor('#3a8bc2')
TEXT_PRIMARY   = colors.HexColor('#1a1a1a')
TEXT_MUTED     = colors.HexColor('#6b7b71')
SEM_PASS      = colors.HexColor('#529067')
SEM_FAIL      = colors.HexColor('#a25b54')

# Table colors (M tier, lower-sat derived green)
TABLE_HEADER_COLOR = colors.HexColor('#1e4d32')
TABLE_HEADER_TEXT  = colors.white
TABLE_ROW_EVEN     = colors.white
TABLE_ROW_ODD      = TABLE_STRIPE

# ── Page Setup ──
PAGE_W, PAGE_H = A4
MARGIN = 0.9 * inch
OUTPUT_PATH = '/home/z/my-project/qa_body.pdf'

# ── Styles ──
styles = getSampleStyleSheet()

sH1 = ParagraphStyle(
    'H1', fontName='Inter-Bold', fontSize=26, leading=32,
    textColor=HEADER_FILL, spaceBefore=18, spaceAfter=10,
    keepWithNext=True,
)
sH2 = ParagraphStyle(
    'H2', fontName='Inter-Bold', fontSize=18, leading=23,
    textColor=colors.HexColor('#1e4d32'), spaceBefore=14, spaceAfter=8,
    keepWithNext=True,
)
sH3 = ParagraphStyle(
    'H3', fontName='Inter-Bold', fontSize=15, leading=19,
    textColor=TEXT_PRIMARY, spaceBefore=10, spaceAfter=6,
    keepWithNext=True,
)
sBody = ParagraphStyle(
    'Body', fontName='Inter', fontSize=11, leading=16,
    textColor=TEXT_PRIMARY, spaceBefore=2, spaceAfter=4,
    alignment=TA_LEFT,
)
sNote = ParagraphStyle(
    'Note', fontName='Inter-Italic', fontSize=10, leading=14,
    textColor=TEXT_MUTED, spaceBefore=2, spaceAfter=6,
)

# TOC styles
toc_h0 = ParagraphStyle(
    'TOCLevel0', fontName='Inter-Bold', fontSize=13, leading=20,
    leftIndent=0, textColor=HEADER_FILL,
)
toc_h1 = ParagraphStyle(
    'TOCLevel1', fontName='Inter', fontSize=11, leading=18,
    leftIndent=20, textColor=TEXT_PRIMARY,
)

# Table cell styles
sCell = ParagraphStyle(
    'Cell', fontName='Inter', fontSize=10, leading=13.5,
    textColor=TEXT_PRIMARY,
)
sCellBold = ParagraphStyle(
    'CellBold', fontName='Inter-Bold', fontSize=10, leading=13.5,
    textColor=TEXT_PRIMARY,
)
sCellSmall = ParagraphStyle(
    'CellSmall', fontName='Inter', fontSize=9, leading=12,
    textColor=TEXT_MUTED,
)

# ── TocDocTemplate ──
class TocDocTemplate(SimpleDocTemplate):
    def afterFlowable(self, flowable):
        if hasattr(flowable, 'bookmark_name'):
            level = getattr(flowable, 'bookmark_level', 0)
            text = getattr(flowable, 'bookmark_text', '')
            key = getattr(flowable, 'bookmark_key', '')
            self.notify('TOCEntry', (level, text, self.page, key))

# ── Helpers ──
def heading(text, style, level=0):
    key = f'h_{hashlib.md5(text.encode()).hexdigest()[:8]}'
    p = Paragraph(f'<a name="{key}"/>{text}', style)
    p.bookmark_name = key
    p.bookmark_level = level
    p.bookmark_text = text
    p.bookmark_key = key
    return p

CHECKBOX = '[ ]'

def test_row(num, test_desc, expected):
    """Create a test row with checkbox, number, description, and expected result."""
    return [
        Paragraph(CHECKBOX, sCell),
        Paragraph(str(num), sCell),
        Paragraph(test_desc, sCell),
        Paragraph(expected, sCell),
    ]

def build_test_table(rows, col_widths=None):
    """Build a styled test checklist table."""
    avail = PAGE_W - 2 * MARGIN
    if col_widths is None:
        col_widths = [32, 30, avail * 0.42, avail * 0.42 - 62]
    header = [
        Paragraph('<b>Pass</b>', ParagraphStyle('th', fontName='Inter-Bold', fontSize=10, leading=13, textColor=TABLE_HEADER_TEXT, alignment=TA_CENTER)),
        Paragraph('<b>#</b>', ParagraphStyle('th2', fontName='Inter-Bold', fontSize=10, leading=13, textColor=TABLE_HEADER_TEXT, alignment=TA_CENTER)),
        Paragraph('<b>Test Step</b>', ParagraphStyle('th3', fontName='Inter-Bold', fontSize=10, leading=13, textColor=TABLE_HEADER_TEXT)),
        Paragraph('<b>Expected Result</b>', ParagraphStyle('th4', fontName='Inter-Bold', fontSize=10, leading=13, textColor=TABLE_HEADER_TEXT)),
    ]
    data = [header] + rows
    t = Table(data, colWidths=col_widths, repeatRows=1)
    style_cmds = [
        ('BACKGROUND', (0, 0), (-1, 0), TABLE_HEADER_COLOR),
        ('TEXTCOLOR', (0, 0), (-1, 0), TABLE_HEADER_TEXT),
        ('FONTNAME', (0, 0), (-1, 0), 'Inter-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 10),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
        ('TOPPADDING', (0, 0), (-1, 0), 8),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 1), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 1), (-1, -1), 5),
        ('GRID', (0, 0), (-1, -1), 0.5, BORDER_COLOR),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('ALIGN', (0, 0), (1, -1), 'CENTER'),
    ]
    for i in range(1, len(data)):
        bg = TABLE_ROW_EVEN if i % 2 == 1 else TABLE_ROW_ODD
        style_cmds.append(('BACKGROUND', (0, i), (-1, i), bg))
    t.setStyle(TableStyle(style_cmds))
    return t

# ── Page Number Footer ──
def add_page_number(canvas, doc):
    canvas.saveState()
    # Header accent line
    canvas.setStrokeColor(HEADER_FILL)
    canvas.setLineWidth(1.5)
    canvas.line(MARGIN, PAGE_H - MARGIN + 12, PAGE_W - MARGIN, PAGE_H - MARGIN + 12)
    # Footer
    canvas.setFont('Inter', 9)
    canvas.setFillColor(TEXT_MUTED)
    canvas.drawString(MARGIN, MARGIN - 18, 'SevaSaathi QA Testing Checklist')
    canvas.drawRightString(PAGE_W - MARGIN, MARGIN - 18, f'Page {doc.page}')
    # Footer accent line
    canvas.setStrokeColor(BORDER_COLOR)
    canvas.setLineWidth(0.5)
    canvas.line(MARGIN, MARGIN - 6, PAGE_W - MARGIN, MARGIN - 6)
    canvas.restoreState()

# ── Build Story ──
story = []

# TOC
story.append(Paragraph('Table of Contents', ParagraphStyle(
    'TOCTitle', fontName='Inter-Bold', fontSize=26, leading=32,
    textColor=HEADER_FILL, spaceBefore=6, spaceAfter=18,
)))
toc = TableOfContents()
toc.levelStyles = [toc_h0, toc_h1]
story.append(toc)
story.append(PageBreak())

# ═══════════════════════════════════════════════════════════
# CHAPTER 1: Landing Page & Public Features
# ═══════════════════════════════════════════════════════════
story.append(heading('Chapter 1: Landing Page & Public Features', sH1, level=0))
story.append(Spacer(1, 4))

ch1_rows = [
    test_row(1, 'Open the landing page URL in a browser', 'Page loads within 3 seconds; HTTP 200 response; no console errors'),
    test_row(2, 'Visually verify all sections are present on the page', 'All 10+ sections visible: Hero, How It Works, Features, Smart Matching, Trust & Safety, Pricing, Testimonials, Footer, etc.'),
    test_row(3, 'Click each navigation link: How It Works, Features, Smart Matching, Trust & Safety, Pricing, Testimonials', 'Page smoothly scrolls to the corresponding section; section heading is visible in the viewport'),
    test_row(4, 'Click the Login button in the navigation bar', 'Redirected to the login page (/login)'),
    test_row(5, 'Click the Get Started button', 'Redirected to the registration page (/register)'),
    test_row(6, 'Resize browser to 375px width (mobile) and verify layout', 'All sections display correctly without horizontal overflow; navigation collapses to hamburger menu if applicable; text is readable'),
    test_row(7, 'Resize browser to 768px width (tablet) and verify layout', 'Two-column layouts adapt appropriately; images and cards resize without overflow'),
    test_row(8, 'Resize browser to 1440px width (desktop) and verify layout', 'Full desktop layout with maximum content width; adequate side margins on large screens'),
    test_row(9, 'Check browser DevTools for PWA manifest and icon files', 'manifest.json loads successfully; icon-192.png returns HTTP 200; icon-512.png returns HTTP 200'),
    test_row(10, 'Scroll to the footer and verify all links and content', 'Footer is visible with all links (Privacy Policy, Terms, Contact, etc.); social media links are present and functional'),
]
story.append(build_test_table(ch1_rows))
story.append(Spacer(1, 10))

# ═══════════════════════════════════════════════════════════
# CHAPTER 2: Authentication System
# ═══════════════════════════════════════════════════════════
story.append(heading('Chapter 2: Authentication System', sH1, level=0))
story.append(Spacer(1, 4))

# 2.1 Email Registration
story.append(heading('2.1 Email Registration', sH2, level=1))
ch2_1_rows = [
    test_row(1, 'Navigate to /register and select Family Member role; fill all fields (name, email, phone, password) and submit', 'Account created successfully; user redirected to OTP verification page; success message displayed'),
    test_row(2, 'Navigate to /register and select Caregiver role; fill all fields and submit', 'Account created successfully; user redirected to OTP verification page'),
    test_row(3, 'Attempt registration with an email that already exists in the database', 'Error message displayed: email already registered; form does not submit'),
    test_row(4, 'Submit registration with password shorter than minimum length (e.g., 4 characters)', 'Validation error: password too short; form does not submit'),
    test_row(5, 'Submit registration with an invalid phone number format', 'Validation error: invalid phone number; form does not submit'),
    test_row(6, 'After successful registration, check the EmailLog table or backend console for OTP email', 'EmailLog table contains a new row with the registered email; email body contains a 6-digit OTP'),
    test_row(7, 'Enter the correct OTP on the verification page and submit', 'OTP verified; user redirected to the appropriate dashboard based on role; emailVerified flag set to true'),
]
story.append(build_test_table(ch2_1_rows))
story.append(Spacer(1, 8))

# 2.2 Email Login
story.append(heading('2.2 Email Login', sH2, level=1))
ch2_2_rows = [
    test_row(1, 'Navigate to /login; enter valid email and password; submit', 'User authenticated; redirected to the role-appropriate dashboard; session cookie is set'),
    test_row(2, 'Enter valid email with incorrect password; submit', 'Error message displayed: invalid credentials; user stays on login page'),
    test_row(3, 'Enter an email that is not registered; submit', 'Error message displayed: user not found; user stays on login page'),
    test_row(4, 'After successful login, refresh the page (F5)', 'User remains logged in; session persists; dashboard loads without re-authentication'),
]
story.append(build_test_table(ch2_2_rows))
story.append(Spacer(1, 8))

# 2.3 Google OAuth
story.append(heading('2.3 Google OAuth', sH2, level=1))
ch2_3_rows = [
    test_row(1, 'Navigate to /login and verify the Google OAuth button is visible', 'Google sign-in button rendered on the login page with correct branding/icon'),
    test_row(2, 'Click the Google OAuth button', 'Browser redirects to Google consent screen; correct client ID and redirect URI are used'),
    test_row(3, 'Complete Google authentication (select or create account)', 'User redirected back to the application; user record created (if new) or updated (if existing); session cookie set'),
    test_row(4, 'After OAuth redirect, verify session state', 'User is logged in; correct user data (name, email, avatar) populated; dashboard accessible'),
]
story.append(build_test_table(ch2_3_rows))
story.append(Spacer(1, 8))

# 2.4 Phone OTP Verification
story.append(heading('2.4 Phone OTP Verification', sH2, level=1))
ch2_4_rows = [
    test_row(1, 'Trigger phone OTP send from the verification endpoint; check response body in dev mode', 'Response includes devOtp field in development mode; HTTP 200 returned'),
    test_row(2, 'Enter the correct 6-digit OTP and submit', 'Phone verified successfully; phoneVerified flag set to true in user record'),
    test_row(3, 'Enter an incorrect 6-digit OTP and submit', 'Error message displayed: invalid OTP; phoneVerified flag remains false'),
    test_row(4, 'Wait 5 minutes after OTP is generated, then submit the same OTP', 'Error message displayed: OTP expired; user can request a new OTP'),
    test_row(5, 'After successful phone verification, check the user record in the database', 'phoneVerified field is true; updated timestamp reflects the verification time'),
]
story.append(build_test_table(ch2_4_rows))
story.append(Spacer(1, 8))

# 2.5 Password Management
story.append(heading('2.5 Password Management', sH2, level=1))
ch2_5_rows = [
    test_row(1, 'Navigate to Change Password; enter current password, new password, confirm new password; submit', 'Password changed successfully; user can log in with the new password'),
    test_row(2, 'Enter incorrect current password in the Change Password form', 'Error message displayed: current password is incorrect; password not changed'),
    test_row(3, 'Navigate to Forgot Password; enter registered email to trigger OTP', 'OTP email sent to the registered address; EmailLog records the email'),
    test_row(4, 'Enter correct OTP, then set a new password', 'Password reset successfully; user can log in with the new password; old password no longer works'),
]
story.append(build_test_table(ch2_5_rows))
story.append(Spacer(1, 10))

# ═══════════════════════════════════════════════════════════
# CHAPTER 3: Family Member Dashboard
# ═══════════════════════════════════════════════════════════
story.append(heading('Chapter 3: Family Member Dashboard', sH1, level=0))
story.append(Spacer(1, 4))

# 3.1 Patient Management
story.append(heading('3.1 Patient Management', sH2, level=1))
ch3_1_rows = [
    test_row(1, 'Navigate to Patient Management; click Add Patient; fill all fields (name, age, condition, care needs, etc.) and submit', 'Patient profile created; appears in patient list with correct details'),
    test_row(2, 'Navigate to Patient List and verify all patients display', 'Patient list shows all created patients with name, age, and condition summary'),
    test_row(3, 'Click on a patient from the list to view details', 'Patient detail page shows all fields: name, age, medical conditions, care requirements, assigned caregivers'),
    test_row(4, 'Click Edit on a patient profile; modify one or more fields; save', 'Patient profile updated; changes reflected on the detail page and list view'),
]
story.append(build_test_table(ch3_1_rows))
story.append(Spacer(1, 8))

# 3.2 Caregiver Search & Smart Matching
story.append(heading('3.2 Caregiver Search & Smart Matching', sH2, level=1))
ch3_2_rows = [
    test_row(1, 'Navigate to Caregiver Search; enter a city name and search', 'Results show only caregivers whose city matches the search term'),
    test_row(2, 'Apply filter by skill (e.g., "Elderly Care")', 'Results narrow to caregivers who have the specified skill in their profile'),
    test_row(3, 'Apply filter by verification status (verified/unverified)', 'Results update to show only caregivers matching the selected verification status'),
    test_row(4, 'Apply filter by minimum rating (e.g., 4 stars)', 'Results show only caregivers with average rating >= the specified value'),
    test_row(5, 'Navigate to Smart Matching; select care requirements (condition type, shift preference, etc.) and run matching', 'Results display caregivers with weighted match scores; scores reflect how well caregivers match the requirements'),
    test_row(6, 'Click on a caregiver from search or matching results to view their full profile', 'Caregiver detail page shows: name, photo, skills, experience, ratings, reviews, availability, hourly rate, verification badges'),
]
story.append(build_test_table(ch3_2_rows))
story.append(Spacer(1, 8))

# 3.3 Booking Management
story.append(heading('3.3 Booking Management', sH2, level=1))
ch3_3_rows = [
    test_row(1, 'Navigate to Create Booking; select a patient, caregiver, shift type (day/night), start/end dates, and times; submit', 'Booking created with status "pending"; all details saved correctly in the database'),
    test_row(2, 'Verify the cost calculation on a new booking (hourly rate x hours per shift x number of days + 10% platform fee)', 'Total cost matches the formula: (hourly_rate x hours x days) x 1.10; displayed cost is correct'),
    test_row(3, 'Navigate to Booking List; use status filters (pending, confirmed, in-progress, completed, cancelled)', 'List updates to show only bookings matching the selected filter; filter toggle works correctly'),
    test_row(4, 'Click on a booking to view its detail page', 'Detail page shows: patient info, caregiver info, payment summary, linked care reports, and reviews'),
    test_row(5, 'Select a pending/confirmed booking and click Cancel; enter a cancellation reason; submit', 'Booking status changes to "cancelled"; cancellation reason is recorded; caregiver is notified'),
    test_row(6, 'Create an urgent care request and verify the 25% surcharge', 'Urgent booking created with total cost = standard cost x 1.25; urgent flag is visible on booking detail'),
]
story.append(build_test_table(ch3_3_rows))
story.append(Spacer(1, 8))

# 3.4 Care Reports
story.append(heading('3.4 Care Reports', sH2, level=1))
ch3_4_rows = [
    test_row(1, 'Navigate to a confirmed/in-progress/completed booking and open the Care Reports section', 'List of care reports submitted for this booking is displayed, sorted by date (newest first)'),
    test_row(2, 'Click on a care report to view its details', 'Report shows: date, activities performed, patient mood, food intake, medicines given, any concerns flagged'),
]
story.append(build_test_table(ch3_4_rows))
story.append(Spacer(1, 8))

# 3.5 Reviews
story.append(heading('3.5 Reviews', sH2, level=1))
ch3_5_rows = [
    test_row(1, 'Navigate to a completed booking and open the Review section; submit a review with ratings for all 4 dimensions (overall, communication, punctuality, care quality) and optional comment', 'Review submitted successfully; all 4 ratings and comment are saved'),
    test_row(2, 'Navigate to the reviewed caregiver profile', 'The new review appears on the caregiver profile with correct ratings and comment; average rating updates'),
]
story.append(build_test_table(ch3_5_rows))
story.append(Spacer(1, 8))

# 3.6 Complaints
story.append(heading('3.6 Complaints', sH2, level=1))
ch3_6_rows = [
    test_row(1, 'Navigate to Complaints section; click File Complaint; fill subject, description, and priority; submit', 'Complaint created with status "open"; confirmation message displayed'),
    test_row(2, 'View the complaints list and check status updates', 'Each complaint shows current status (open, in-progress, resolved); status history/timeline is visible'),
]
story.append(build_test_table(ch3_6_rows))
story.append(Spacer(1, 8))

# 3.7 Notifications
story.append(heading('3.7 Notifications', sH2, level=1))
ch3_7_rows = [
    test_row(1, 'Verify the notification bell icon in the header shows an unread count badge', 'Bell icon displays a numeric badge when there are unread notifications; badge count matches actual unread count'),
    test_row(2, 'Click the bell icon to open the notification dropdown/list', 'Notification list appears showing all notifications with timestamps, read/unread state, and brief descriptions'),
    test_row(3, 'View a notification; verify it is automatically marked as read', 'Opened notification status changes to read; unread count badge decreases by 1; bell badge updates'),
]
story.append(build_test_table(ch3_7_rows))
story.append(Spacer(1, 10))

# ═══════════════════════════════════════════════════════════
# CHAPTER 4: Caregiver Dashboard
# ═══════════════════════════════════════════════════════════
story.append(heading('Chapter 4: Caregiver Dashboard', sH1, level=0))
story.append(Spacer(1, 4))

# 4.1 Profile Setup
story.append(heading('4.1 Profile Setup', sH2, level=1))
ch4_1_rows = [
    test_row(1, 'Navigate to Profile Setup; fill all fields (city, gender, address, experience years, skills, bio, hourly rate); submit', 'Profile saved successfully; all fields reflect the entered values on the profile page'),
    test_row(2, 'Navigate to Availability; set day shift and night shift availability for each day of the week; save', 'Weekly availability schedule saved; correct shift types displayed for each day; available time slots match settings'),
]
story.append(build_test_table(ch4_1_rows))
story.append(Spacer(1, 8))

# 4.2 Document Verification
story.append(heading('4.2 Document Verification', sH2, level=1))
ch4_2_rows = [
    test_row(1, 'Navigate to Document Upload; select a document type (e.g., Aadhaar, PAN); upload a valid file; submit', 'Document uploaded successfully; appears in document list with type, file name, and status "pending"'),
    test_row(2, 'Upload an Aadhaar card image and verify AI OCR extraction', 'System extracts name, date of birth, Aadhaar number from the image; extracted data is displayed for review before submission'),
    test_row(3, 'Check the verification status of an uploaded document', 'Document shows correct status: pending, approved, or rejected; rejection reason visible if rejected'),
]
story.append(build_test_table(ch4_2_rows))
story.append(Spacer(1, 8))

# 4.3 Booking Management
story.append(heading('4.3 Booking Management', sH2, level=1))
ch4_3_rows = [
    test_row(1, 'Navigate to My Bookings; view the list of assigned bookings', 'All bookings assigned to this caregiver are listed with status, patient name, dates, and shift type'),
    test_row(2, 'Select a pending booking and click Confirm', 'Booking status changes to "confirmed"; family member receives a notification'),
    test_row(3, 'Select a confirmed booking and click Mark In-Progress', 'Booking status changes to "in-progress"; care report submission becomes available'),
    test_row(4, 'Select an in-progress booking and click Mark Completed', 'Booking status changes to "completed"; family member is notified; review submission becomes available'),
]
story.append(build_test_table(ch4_3_rows))
story.append(Spacer(1, 8))

# 4.4 Care Reports
story.append(heading('4.4 Care Reports', sH2, level=1))
ch4_4_rows = [
    test_row(1, 'For an in-progress booking, navigate to Submit Care Report; fill all fields (activities, mood, food, medicines, concerns); submit', 'Care report created successfully; report appears in the booking care reports section'),
    test_row(2, 'After submitting a care report, check the family member notification', 'Family member receives a real-time notification (Socket.io) about the new care report'),
    test_row(3, 'After submitting a care report, check the EmailLog table for notification email', 'EmailLog contains a new entry for the family member; email content includes care report summary with highlighted concerns'),
]
story.append(build_test_table(ch4_4_rows))
story.append(Spacer(1, 8))

# 4.5 Earnings & Withdrawals
story.append(heading('4.5 Earnings & Withdrawals', sH2, level=1))
ch4_5_rows = [
    test_row(1, 'Navigate to Earnings section and view earnings history', 'Earnings page shows a list of all completed booking payments with date, amount, and booking reference'),
    test_row(2, 'Navigate to Withdrawals; enter amount and select withdrawal method (UPI or bank transfer); submit', 'Withdrawal request created with status "pending"; available balance decreases by the requested amount'),
    test_row(3, 'Verify the balance calculation: available = 90% of total earnings minus pending withdrawal amounts', 'Displayed available balance matches: (total_earned x 0.90) - sum(pending_withdrawals); calculation is accurate'),
]
story.append(build_test_table(ch4_5_rows))
story.append(Spacer(1, 8))

# 4.6 Reviews
story.append(heading('4.6 Reviews', sH2, level=1))
ch4_6_rows = [
    test_row(1, 'Navigate to My Reviews; view the list of received reviews', 'All reviews from family members are displayed with ratings (overall, communication, punctuality, care quality), comments, and dates'),
]
story.append(build_test_table(ch4_6_rows))
story.append(Spacer(1, 10))

# ═══════════════════════════════════════════════════════════
# CHAPTER 5: Admin Dashboard
# ═══════════════════════════════════════════════════════════
story.append(heading('Chapter 5: Admin Dashboard', sH1, level=0))
story.append(Spacer(1, 4))

# 5.1 Overview Analytics
story.append(heading('5.1 Overview Analytics', sH2, level=1))
ch5_1_rows = [
    test_row(1, 'Navigate to Admin Dashboard; verify all stat cards display correctly', 'Cards show: total users, total bookings, total revenue, average rating, open complaints; all values are non-negative numbers'),
    test_row(2, 'Verify the Bookings by Status chart renders', 'Chart displays with correct segments for each booking status (pending, confirmed, in-progress, completed, cancelled); legend is readable'),
    test_row(3, 'Verify the Complaints by Status chart renders', 'Chart displays with correct segments for complaint statuses; data matches database counts'),
    test_row(4, 'Verify the Caregivers by City chart renders', 'Chart displays caregiver distribution across cities; city names are readable; counts are accurate'),
]
story.append(build_test_table(ch5_1_rows))
story.append(Spacer(1, 8))

# 5.2 User Management
story.append(heading('5.2 User Management', sH2, level=1))
ch5_2_rows = [
    test_row(1, 'Navigate to User Management; search by name', 'Results show users whose name contains the search term; results are accurate'),
    test_row(2, 'Search users by email', 'Results show the user matching the email exactly; partial email search works if implemented'),
    test_row(3, 'Search users by phone number', 'Results show the user matching the phone number'),
    test_row(4, 'Apply role filter (Family, Caregiver, Admin)', 'User list updates to show only users with the selected role'),
    test_row(5, 'Click on a user to view detailed profile', 'User detail page shows: name, email, phone, role, registration date, verification status, associated patients/bookings'),
    test_row(6, 'Delete a test user (non-critical account) and verify cascade delete', 'User removed from database; associated records (patients, bookings for test user) are also removed or handled gracefully'),
]
story.append(build_test_table(ch5_2_rows))
story.append(Spacer(1, 8))

# 5.3 Verification Management
story.append(heading('5.3 Verification Management', sH2, level=1))
ch5_3_rows = [
    test_row(1, 'Navigate to Verification Management; view the list of verification documents with filters', 'List shows all uploaded documents with caregiver name, document type, upload date, and status'),
    test_row(2, 'Apply filters (document type, status, caregiver name)', 'List updates correctly based on applied filters; combined filters work together'),
    test_row(3, 'Select a pending document and click Approve', 'Document status changes to "approved"; caregiver is notified'),
    test_row(4, 'Select a pending document and click Reject; enter a rejection reason; submit', 'Document status changes to "rejected"; rejection reason is recorded and visible; caregiver is notified'),
    test_row(5, 'Approve all required documents for a caregiver and verify auto-promotion', 'When all document types are approved, caregiver verification status automatically changes to "verified"'),
]
story.append(build_test_table(ch5_3_rows))
story.append(Spacer(1, 8))

# 5.4 Booking Management
story.append(heading('5.4 Booking Management', sH2, level=1))
ch5_4_rows = [
    test_row(1, 'Navigate to Admin Booking Management; view all platform bookings', 'List displays all bookings across the platform with patient name, caregiver name, dates, status, and amount'),
    test_row(2, 'Search bookings by patient name or caregiver name', 'Results show bookings matching the search term'),
]
story.append(build_test_table(ch5_4_rows))
story.append(Spacer(1, 8))

# 5.5 Withdrawal Management
story.append(heading('5.5 Withdrawal Management', sH2, level=1))
ch5_5_rows = [
    test_row(1, 'Navigate to Withdrawal Management; view all withdrawal requests', 'List shows all withdrawal requests with caregiver name, amount, method (UPI/bank), date, and status'),
    test_row(2, 'Select a pending withdrawal and process it through the status workflow (pending -> processing -> completed)', 'Status updates correctly at each step; caregiver notified upon completion'),
    test_row(3, 'Select a pending withdrawal and click Reject; enter a reason', 'Status changes to "rejected"; reason is recorded; caregiver balance is restored'),
]
story.append(build_test_table(ch5_5_rows))
story.append(Spacer(1, 8))

# 5.6 Review & Complaint Management
story.append(heading('5.6 Review & Complaint Management', sH2, level=1))
ch5_6_rows = [
    test_row(1, 'Navigate to Review Management; view all reviews across the platform', 'List shows all reviews with reviewer name, caregiver name, ratings, date, and comment'),
    test_row(2, 'Navigate to Complaint Management; view all complaints', 'List shows all complaints with complainant, subject, priority, status, and date'),
    test_row(3, 'Select a complaint; assign it to an admin or caregiver; update status to in-progress', 'Complaint assigned correctly; status changes; assigned user receives notification'),
    test_row(4, 'Resolve a complaint and add resolution notes', 'Complaint status changes to "resolved"; resolution notes are saved and visible in the complaint timeline'),
]
story.append(build_test_table(ch5_6_rows))
story.append(Spacer(1, 10))

# ═══════════════════════════════════════════════════════════
# CHAPTER 6: Real-Time Features (Socket.io)
# ═══════════════════════════════════════════════════════════
story.append(heading('Chapter 6: Real-Time Features (Socket.io)', sH1, level=0))
story.append(Spacer(1, 4))

ch6_rows = [
    test_row(1, 'Verify the Socket.io service is running on port 3005', 'Service responds to connection requests on port 3005; no errors in server logs'),
    test_row(2, 'Trigger a payment status update as an admin; verify the family member receives a real-time notification', 'Family member browser receives a Socket.io event with payment update details; UI updates without page refresh'),
    test_row(3, 'Trigger a booking status change (e.g., confirm); verify the caregiver receives a real-time notification', 'Caregiver browser receives a Socket.io event with booking update details; UI updates without page refresh'),
    test_row(4, 'Submit a care report as a caregiver; verify the family member receives a real-time notification', 'Family member browser receives a Socket.io event for the new care report; notification appears instantly'),
    test_row(5, 'Disconnect the browser from the network and reconnect; verify Socket.io reconnects automatically', 'After reconnecting, the Socket.io connection is re-established; no missed events during disconnect; connection state recovers'),
]
story.append(build_test_table(ch6_rows))
story.append(Spacer(1, 10))

# ═══════════════════════════════════════════════════════════
# CHAPTER 7: Email Service
# ═══════════════════════════════════════════════════════════
story.append(heading('Chapter 7: Email Service', sH1, level=0))
story.append(Spacer(1, 4))

ch7_rows = [
    test_row(1, 'Trigger OTP email by initiating registration or password reset', 'Email is sent via Gmail SMTP; email arrives in the recipient inbox (or spam); contains the correct 6-digit OTP'),
    test_row(2, 'Create a new booking and verify the booking confirmation email', 'Email sent to family member with booking details: patient name, caregiver name, dates, shift, total cost'),
    test_row(3, 'Submit a care report with concerns flagged; verify the care report notification email', 'Email sent to family member with care report summary; flagged concerns are highlighted or prominently displayed in the email body'),
    test_row(4, 'After sending any email, check the EmailLog table in the database', 'EmailLog table contains a new row with: recipient email, subject, email type/status, timestamp; all fields are populated'),
]
story.append(build_test_table(ch7_rows))
story.append(Spacer(1, 10))

# ═══════════════════════════════════════════════════════════
# CHAPTER 8: SMS Service
# ═══════════════════════════════════════════════════════════
story.append(heading('Chapter 8: SMS Service', sH1, level=0))
story.append(Spacer(1, 4))

ch8_rows = [
    test_row(1, 'Trigger phone OTP send via the API endpoint', 'In production: SMS sent via Fast2SMS to the phone number; in dev mode: devOtp returned in the API response body'),
    test_row(2, 'In development mode, verify the devOtp is returned in the response', 'API response JSON includes a devOtp field with the 6-digit OTP; no actual SMS is sent in dev mode'),
    test_row(3, 'After OTP send, verify the OTP is stored in the database', 'Database contains the OTP record with: phone number, OTP code, expiration timestamp, used flag (initially false)'),
]
story.append(build_test_table(ch8_rows))
story.append(Spacer(1, 10))

# ═══════════════════════════════════════════════════════════
# CHAPTER 9: API Health Check
# ═══════════════════════════════════════════════════════════
story.append(heading('Chapter 9: API Health Check', sH1, level=0))
story.append(Spacer(1, 4))

ch9_rows = [
    test_row(1, 'Send GET/POST requests to all auth endpoints (/auth/register, /auth/login, /auth/google, /auth/otp-send, /auth/otp-verify)', 'All endpoints return appropriate HTTP status codes (200, 201, 400, 401); response bodies match API schema'),
    test_row(2, 'Send GET/POST/PUT requests to all booking endpoints (/bookings, /bookings/:id, /bookings/cancel, /bookings/urgent)', 'All endpoints respond correctly; CRUD operations work as expected; status transitions are enforced'),
    test_row(3, 'Send GET/PUT requests to all caregiver endpoints (/caregivers, /caregivers/:id, /caregivers/profile, /caregivers/availability)', 'All endpoints respond with correct data; profile updates persist; availability schedules save correctly'),
    test_row(4, 'Send GET requests to all admin endpoints (/admin/users, /admin/verifications, /admin/bookings, /admin/withdrawals, /admin/reviews, /admin/complaints)', 'All endpoints respond correctly for admin users; non-admin users receive 401 or 403 Forbidden'),
    test_row(5, 'Send requests with invalid inputs (missing fields, wrong data types, invalid IDs)', 'Endpoints return HTTP 400 with descriptive error messages; no server crashes or 500 errors'),
    test_row(6, 'Send requests without authentication to protected endpoints', 'Endpoints return HTTP 401 Unauthorized; no data is leaked in the response body'),
]
story.append(build_test_table(ch9_rows))

# ── Build Document ──
doc = TocDocTemplate(
    OUTPUT_PATH,
    pagesize=A4,
    leftMargin=MARGIN,
    rightMargin=MARGIN,
    topMargin=MARGIN + 12,
    bottomMargin=MARGIN + 8,
    title='SevaSaathi QA Testing Checklist',
    author='Z.ai',
    creator='Z.ai',
)
doc.multiBuild(story, onLaterPages=add_page_number, onFirstPage=add_page_number)
print(f'Body PDF written to {OUTPUT_PATH}')
