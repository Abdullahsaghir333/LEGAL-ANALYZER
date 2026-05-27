// @ts-nocheck
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Case from '@/models/Case';
import Contract from '@/models/Contract';
import Invoice from '@/models/Invoice';
import TimeEntry from '@/models/TimeEntry';

export async function GET(request, { params }) {
  try {
    await connectDB();

    const { id } = params;

    const caseData = await Case.findById(id)
      .populate('clientId', 'name email phone')
      .lean();

    if (!caseData) {
      return NextResponse.json(
        { error: 'Case not found' },
        { status: 404 }
      );
    }

    // Get related documents (contracts), time entries, and invoices
    const contracts = await Contract.find({ caseId: id })
      .sort({ createdAt: -1 })
      .lean();

    const timeEntries = await TimeEntry.find({ caseId: id })
      .sort({ date: -1 })
      .lean();

    const invoices = await Invoice.find({ 
      clientId: caseData.clientId?._id 
    })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      ...caseData,
      contracts,
      timeEntries,
      invoices,
    });
  } catch (error) {
    console.error('Case detail API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch case' },
      { status: 500 }
    );
  }
}