// @ts-nocheck
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Invoice from '@/models/Invoice';

export async function GET(request, { params }) {
  try {
    await connectDB();

    const { id } = params;

    const invoice = await Invoice.findById(id)
      .populate('clientId', 'name email phone')
      .lean();

    if (!invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(invoice);
  } catch (error) {
    console.error('Invoice detail API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invoice' },
      { status: 500 }
    );
  }
}