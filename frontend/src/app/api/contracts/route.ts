// @ts-nocheck
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Contract from '@/models/Contract';

export async function GET() {
  try {
    await connectDB();

    const contracts = await Contract.find()
      .sort({ createdAt: -1 })
      .populate('clientId', 'name')
      .lean();

    return NextResponse.json(contracts);
  } catch (error) {
    console.error('Contracts API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch contracts' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    await connectDB();

    const body = await request.json();

    const contract = await Contract.create(body);

    return NextResponse.json(contract, { status: 201 });
  } catch (error) {
    console.error('Create contract error:', error);
    return NextResponse.json(
      { error: 'Failed to create contract' },
      { status: 500 }
    );
  }
}