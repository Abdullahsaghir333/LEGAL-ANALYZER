// @ts-nocheck
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Case from '@/models/Case';

export async function GET() {
  try {
    await connectDB();

    const cases = await Case.find()
      .sort({ createdAt: -1 })
      .populate('clientId', 'name email')
      .lean();

    return NextResponse.json(cases);
  } catch (error) {
    console.error('Cases API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cases' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    await connectDB();

    const body = await request.json();

    const caseData = await Case.create(body);

    return NextResponse.json(caseData, { status: 201 });
  } catch (error) {
    console.error('Create case error:', error);
    return NextResponse.json(
      { error: 'Failed to create case' },
      { status: 500 }
    );
  }
}