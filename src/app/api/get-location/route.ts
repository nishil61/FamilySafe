import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Get user's location from IP address using ip-api.com (free tier)
 * Returns city, region, country data
 */
export async function GET(request: NextRequest) {
  try {
    // Get client IP from request headers
    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                     request.headers.get('x-real-ip') || 
                     '8.8.8.8'; // Fallback to a known IP

    // Use ip-api.com free API (no key required for basic queries)
    const response = await fetch(`http://ip-api.com/json/${clientIp.trim()}?fields=query,city,region,country,isp`, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { success: false, message: 'Failed to fetch location' },
        { status: 500 }
      );
    }

    const data = await response.json();

    if (data.status === 'fail') {
      console.warn('IP API error:', data.message);
      return NextResponse.json(
        { 
          success: true, 
          location: {
            city: 'Unknown',
            region: 'Unknown',
            country: 'Unknown',
            ip: clientIp.trim(),
          }
        }
      );
    }

    return NextResponse.json({
      success: true,
      location: {
        city: data.city || 'Unknown',
        region: data.region || 'Unknown',
        country: data.country || 'Unknown',
        isp: data.isp || 'Unknown ISP',
        ip: data.query,
      }
    });

  } catch (error: any) {
    console.error('Location fetch error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Could not determine location',
        location: {
          city: 'Unknown',
          region: 'Unknown',
          country: 'Unknown',
        }
      },
      { status: 500 }
    );
  }
}
