import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    // Check for E2E auth via custom SSO cookie
    const cookieStore = await cookies();
    const e2eToken = cookieStore.get('beak_access_token');
    const e2eUserId = cookieStore.get('beak_user_id');

    // E2E Testing Mode
    const isE2ETesting =
      process.env.E2E_TESTING === 'true' ||
      (process.env.NODE_ENV !== 'production' && e2eToken && e2eUserId);

    if (isE2ETesting && e2eToken && e2eUserId) {
      console.log('[Profile API] E2E testing mode: returning mock data');

      return NextResponse.json({
        id: e2eUserId.value,
        email: 'e2e-test@beak-gaming.test',
        facility_name: 'E2E Test Facility',
        email_notifications_enabled: true,
        game_reminders_enabled: false,
        weekly_summary_enabled: false,
        marketing_emails_enabled: false,
      });
    }

    // Normal flow: Check Supabase authentication
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get profile from database
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Profile fetch error:', profileError);
      return NextResponse.json(
        { error: 'Failed to fetch profile' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      id: user.id,
      email: user.email,
      ...profile,
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
