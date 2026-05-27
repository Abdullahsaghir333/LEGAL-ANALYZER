// @ts-nocheck
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Contract from '@/models/Contract';

export async function GET(request, { params }) {
  try {
    await connectDB();

    const { id } = params;

    const contract = await Contract.findById(id)
      .populate('clientId', 'name email phone')
      .populate('caseId', 'name status')
      .lean();

    if (!contract) {
      return NextResponse.json(
        { error: 'Contract not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(contract);
  } catch (error) {
    console.error('Contract detail API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch contract' },
      { status: 500 }
    );
  }
}