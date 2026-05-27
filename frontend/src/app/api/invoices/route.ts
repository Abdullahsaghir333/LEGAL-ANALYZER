// @ts-nocheck
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Invoice from '@/models/Invoice';

export async function GET() {
  try {
    await connectDB();

    const invoices = await Invoice.find()
      .sort({ createdAt: -1 })
      .populate('clientId', 'name')
      .lean();

    return NextResponse.json(invoices);
  } catch (error) {
    console.error('Invoices API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invoices' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    await connectDB();

    const body = await request.json();

    // Generate invoice number if not provided
    if (!body.invoiceNumber) {
      const count = await Invoice.countDocuments();
      body.invoiceNumber = `INV-${new Date().getFullYear()}-${String(count + 1).padStart(3, '0')}`;
    }

    const invoice = await Invoice.create(body);

    return NextResponse.json(invoice, { status: 201 });
  } catch (error) {
    console.error('Create invoice error:', error);
    return NextResponse.json(
      { error: 'Failed to create invoice' },
      { status: 500 }
    );
  }
}