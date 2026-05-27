// @ts-nocheck
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Client from '@/models/Client';
import Case from '@/models/Case';
import Invoice from '@/models/Invoice';

export async function GET(request, { params }) {
  try {
    await connectDB();

    const { id } = params;

    const client = await Client.findById(id).lean();

    if (!client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }

    // Get client's cases and invoices
    const cases = await Case.find({ clientId: id })
      .sort({ createdAt: -1 })
      .lean();

    const invoices = await Invoice.find({ clientId: id })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      ...client,
      cases,
      invoices,
    });
  } catch (error) {
    console.error('Client detail API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch client' },
      { status: 500 }
    );
  }
}