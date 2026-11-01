import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface CompleteMeetingRequest {
  recordId: string;
  meetingDate: string;
  desiredStatus: 'completed' | 'scheduled';
  userRole?: string;
  gpName?: string;
}

/**
 * Authoritative Server-side Meeting Completion Verification API
 * Enforces India Standard Time (Asia/Kolkata) date comparison and role authorization.
 */
export async function POST(req: NextRequest) {
  try {
    const body: CompleteMeetingRequest = await req.json();
    const { recordId, meetingDate, desiredStatus, userRole, gpName } = body;

    if (!recordId) {
      return NextResponse.json(
        { success: false, error: 'अभिलेख आईडी (Record ID) अनिवार्य है।' },
        { status: 400 }
      );
    }

    // 1. Authoritative Server Time in Asia/Kolkata
    const now = new Date();
    const dateFormatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    const serverDateIST = dateFormatter.format(now); // "YYYY-MM-DD"

    // 2. Role Check (Only DDO and Admin can modify official meeting status)
    if (userRole && !['ddo', 'admin'].includes(userRole.toLowerCase())) {
      return NextResponse.json(
        {
          success: false,
          error: 'अनधिकृत: बैठक स्थिति बदलने का अधिकार केवल DDO अथवा Admin को है।'
        },
        { status: 403 }
      );
    }

    // 3. Date Validation for Completion
    if (desiredStatus === 'completed') {
      if (!meetingDate || meetingDate.trim() === '') {
        return NextResponse.json(
          {
            success: false,
            error: 'ग्राम पंचायत की बैठक तिथि निर्धारित नहीं है।'
          },
          { status: 400 }
        );
      }

      // Check: serverDateIST < meetingDate
      if (serverDateIST < meetingDate) {
        return NextResponse.json(
          {
            success: false,
            error: 'इस ग्राम पंचायत की सोशल ऑडिट बैठक की निर्धारित तिथि अभी नहीं आई है। निर्धारित तिथि से पहले बैठक को सम्पन्न नहीं किया जा सकता।',
            serverDate: serverDateIST,
            scheduledDate: meetingDate
          },
          { status: 400 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      recordId,
      desiredStatus,
      serverDate: serverDateIST,
      timestamp: now.getTime(),
      message: desiredStatus === 'completed' 
        ? `${gpName || 'ग्राम पंचायत'} की सोशल ऑडिट बैठक सफलतापूर्वक सम्पन्न चिन्हित की गई।`
        : `${gpName || 'ग्राम पंचायत'} की बैठक पुनः प्रस्तावित की गई।`
    });
  } catch (err: any) {
    console.error('Server error during meeting completion verification:', err);
    return NextResponse.json(
      { success: false, error: 'सर्वर पर बैठक सत्यापन में तकनीकी त्रुटि आई।' },
      { status: 500 }
    );
  }
}

