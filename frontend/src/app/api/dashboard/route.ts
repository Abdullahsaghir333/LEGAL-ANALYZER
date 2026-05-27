// @ts-nocheck
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Client from '@/models/Client';
import Case from '@/models/Case';
import Invoice from '@/models/Invoice';

export async function GET() {
  try {
    await connectDB();

    const totalClients = await Client.countDocuments({ status: 'active' });
    const activeCases = await Case.countDocuments({ status: 'active' });
    const unpaidInvoices = await Invoice.countDocuments({ status: { $in: ['unpaid', 'overdue'] } });

    // Get recent activity from cases and invoices
    const recentCases = await Case.find()
      .sort({ createdAt: -1 })
      .limit(3)
      .populate('clientId', 'name')
      .lean();

    const recentInvoices = await Invoice.find()
      .sort({ createdAt: -1 })
      .limit(2)
      .populate('clientId', 'name')
      .lean();

    const recentActivity = [
      ...recentCases.map(c => ({
        icon: 'description',
        title: `Case Created: ${c.name}`,
        subtitle: c.clientId?.name ? `Client: ${c.clientId.name}` : '',
        time: c.createdAt ? new Date(c.createdAt).toLocaleDateString() : 'Recently',
        tag: 'Case',
        tagColor: 'bg-primary-fixed/40 text-primary',
      })),
      ...recentInvoices.map(i => ({
        icon: 'receipt_long',
        title: `Invoice Generated: ${i.invoiceNumber}`,
        subtitle: i.clientId?.name ? `Client: ${i.clientId.name} • Rs. ${i.amount.toLocaleString()}` : '',
        time: i.createdAt ? new Date(i.createdAt).toLocaleDateString() : 'Recently',
        tag: 'Billing',
        tagColor: 'bg-warning-light text-warning',
      })),
    ];

    return NextResponse.json({
      totalClients,
      activeCases,
      unpaidInvoices,
      recentActivity,
    });
  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}