// @ts-nocheck
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Invoice from '@/models/Invoice';

export async function GET() {
  try {
    await connectDB();

    // Get invoices from the last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const invoices = await Invoice.find({
      status: 'paid',
      createdAt: { $gte: sixMonthsAgo }
    }).lean();

    // Group by month
    const monthlyRevenue = {};
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Initialize last 6 months with 0
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now);
      d.setMonth(d.getMonth() - i);
      const monthKey = months[d.getMonth()];
      monthlyRevenue[monthKey] = 0;
    }

    // Sum up paid invoices by month
    invoices.forEach(invoice => {
      if (invoice.createdAt) {
        const date = new Date(invoice.createdAt);
        const monthKey = months[date.getMonth()];
        if (monthKey in monthlyRevenue) {
          monthlyRevenue[monthKey] += invoice.amount || 0;
        }
      }
    });

    const revenueData = Object.entries(monthlyRevenue).map(([month, revenue]) => ({
      month,
      revenue,
    }));

    return NextResponse.json(revenueData);
  } catch (error) {
    console.error('Revenue API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch revenue data' },
      { status: 500 }
    );
  }
}