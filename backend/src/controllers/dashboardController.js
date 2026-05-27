import asyncHandler from 'express-async-handler';
import Client from '../models/Client.js';
import Case from '../models/Case.js';
import Invoice from '../models/Invoice.js';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const PRACTICE_COLORS = {
  'Family Law': '#4f46e5',
  Litigation: '#7c6df0',
  Corporate: '#505f76',
  'Real Estate': '#c7c4d8',
  Criminal: '#ba1a1a',
  General: '#e0e3e5',
};

function categorizePracticeArea(caseTitle) {
  const t = (caseTitle || '').toLowerCase();
  if (/family|khula|custody|divorce|nafqa|maintenance/.test(t)) return 'Family Law';
  if (/civil|litigation|lawsuit/.test(t)) return 'Litigation';
  if (/corporate|contract|business/.test(t)) return 'Corporate';
  if (/property|real estate|lease/.test(t)) return 'Real Estate';
  if (/criminal/.test(t)) return 'Criminal';
  return 'General';
}

function pctChange(current, previous) {
  if (!previous || previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

function initMonthBuckets(monthCount) {
  const buckets = {};
  const now = new Date();
  for (let i = monthCount - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    buckets[key] = {
      month: MONTHS[d.getMonth()],
      year: d.getFullYear(),
      revenue: 0,
      expenses: 0,
    };
  }
  return buckets;
}

function monthKeyFromDate(date) {
  const d = new Date(date);
  return `${d.getFullYear()}-${d.getMonth()}`;
}

/** Lawyer dashboard — scoped to owning lawyer */
export const getDashboard = asyncHandler(async (req, res) => {
  if (req.user.role === 'client') {
    return res.status(403).json({ message: 'Lawyer dashboard only' });
  }

  const clients = await Client.find({ user_id: req.user._id });
  const clientIds = clients.map((c) => c._id);

  const activeCases =
    clientIds.length === 0 ? 0 : await Case.countDocuments({ client_id: { $in: clientIds }, status: 'open' });

  const unpaidInvoices =
    clientIds.length === 0
      ? 0
      : await Invoice.countDocuments({
          client_id: { $in: clientIds },
          status: { $in: ['unpaid', 'pending'] },
        });

  const overdueInvoices =
    clientIds.length === 0
      ? 0
      : await Invoice.countDocuments({
          client_id: { $in: clientIds },
          status: { $nin: ['paid'] },
          due_date: { $lt: new Date() },
        });

  const recentCases =
    clientIds.length === 0
      ? []
      : await Case.find({ client_id: { $in: clientIds } })
          .sort({ createdAt: -1 })
          .limit(3)
          .populate('client_id', 'name');

  const recentInvoices =
    clientIds.length === 0
      ? []
      : await Invoice.find({ client_id: { $in: clientIds } })
          .sort({ createdAt: -1 })
          .limit(3)
          .populate('client_id', 'name');

  const recentActivity = [
    ...recentCases.map((c) => ({
      icon: 'description',
      title: `Case: ${c.title || 'Untitled'}`,
      subtitle: c.client_id?.name ? `Client: ${c.client_id.name}` : '',
      time: c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '',
      tag: 'Case',
      tagColor: 'bg-primary-fixed/40 text-primary',
    })),
    ...recentInvoices.map((inv) => ({
      icon: 'receipt_long',
      title: `Invoice ${inv.invoice_number}`,
      subtitle: inv.client_id?.name
        ? `Client: ${inv.client_id.name} • Rs. ${(inv.total || 0).toLocaleString()}`
        : '',
      time: inv.createdAt ? new Date(inv.createdAt).toLocaleDateString() : '',
      tag: 'Billing',
      tagColor: 'bg-warning-light text-warning',
    })),
  ].slice(0, 6);

  res.json({
    totalClients: clients.length,
    activeCases,
    unpaidInvoices,
    overdueCount: overdueInvoices,
    recentActivity,
  });
});

/** Full revenue analytics for the analytics page */
export const getRevenueAnalytics = asyncHandler(async (req, res) => {
  if (req.user.role === 'client') {
    return res.status(403).json({ message: 'Analytics for lawyers only' });
  }

  const monthCount = Math.min(12, Math.max(3, parseInt(req.query.months, 10) || 12));
  const periodStart = new Date();
  periodStart.setMonth(periodStart.getMonth() - monthCount);
  periodStart.setDate(1);
  periodStart.setHours(0, 0, 0, 0);

  const prevPeriodStart = new Date(periodStart);
  prevPeriodStart.setMonth(prevPeriodStart.getMonth() - monthCount);

  const clients = await Client.find({ user_id: req.user._id }).lean();
  const clientIds = clients.map((c) => c._id);
  const clientMap = Object.fromEntries(clients.map((c) => [c._id.toString(), c]));

  if (clientIds.length === 0) {
    return res.json({
      period: { months: monthCount, label: `Last ${monthCount} Months` },
      kpis: {
        totalRevenue: 0,
        totalRevenueChange: 0,
        monthlyRecurringRevenue: 0,
        mrrChange: 0,
        averageDealValue: 0,
        avgDealChange: 0,
      },
      cashFlow: Object.values(initMonthBuckets(monthCount)),
      practiceAreas: [],
      topClients: [],
      monthlyRevenue: [],
    });
  }

  const [invoices, cases] = await Promise.all([
    Invoice.find({ client_id: { $in: clientIds }, createdAt: { $gte: prevPeriodStart } })
      .populate('client_id', 'name email company status')
      .populate('case_id', 'title status')
      .lean(),
    Case.find({ client_id: { $in: clientIds } }).lean(),
  ]);

  const currentPeriodInvoices = invoices.filter(
    (inv) => inv.createdAt && new Date(inv.createdAt) >= periodStart
  );
  const previousPeriodInvoices = invoices.filter((inv) => {
    if (!inv.createdAt) return false;
    const d = new Date(inv.createdAt);
    return d >= prevPeriodStart && d < periodStart;
  });

  const paidCurrent = currentPeriodInvoices.filter((inv) => inv.status === 'paid');
  const paidPrevious = previousPeriodInvoices.filter((inv) => inv.status === 'paid');

  const totalRevenue = paidCurrent.reduce((sum, inv) => sum + (inv.total || 0), 0);
  const prevTotalRevenue = paidPrevious.reduce((sum, inv) => sum + (inv.total || 0), 0);

  const last3MonthKeys = Object.keys(initMonthBuckets(3));
  const buckets3 = initMonthBuckets(3);
  paidCurrent.forEach((inv) => {
    const key = monthKeyFromDate(inv.createdAt);
    if (key in buckets3) buckets3[key].revenue += inv.total || 0;
  });
  const last3Revenues = Object.values(buckets3).map((b) => b.revenue);
  const monthlyRecurringRevenue =
    last3Revenues.length > 0
      ? last3Revenues.reduce((a, b) => a + b, 0) / last3Revenues.length
      : 0;

  const prevBuckets3 = initMonthBuckets(3);
  const prev3Start = new Date();
  prev3Start.setMonth(prev3Start.getMonth() - 6);
  paidPrevious
    .filter((inv) => new Date(inv.createdAt) >= prev3Start)
    .forEach((inv) => {
      const key = monthKeyFromDate(inv.createdAt);
      if (key in prevBuckets3) prevBuckets3[key].revenue += inv.total || 0;
    });
  const prev3Revenues = Object.values(prevBuckets3).map((b) => b.revenue);
  const prevMrr =
    prev3Revenues.length > 0 ? prev3Revenues.reduce((a, b) => a + b, 0) / prev3Revenues.length : 0;

  const paidCount = paidCurrent.length;
  const prevPaidCount = paidPrevious.length;
  const averageDealValue = paidCount > 0 ? totalRevenue / paidCount : 0;
  const prevAvgDeal = prevPaidCount > 0 ? prevTotalRevenue / prevPaidCount : 0;

  const cashFlowBuckets = initMonthBuckets(monthCount);
  currentPeriodInvoices.forEach((inv) => {
    if (!inv.createdAt) return;
    const key = monthKeyFromDate(inv.createdAt);
    if (!(key in cashFlowBuckets)) return;
    if (inv.status === 'paid') {
      cashFlowBuckets[key].revenue += inv.total || 0;
      cashFlowBuckets[key].expenses += inv.tax || 0;
    } else if (['pending', 'unpaid', 'overdue'].includes(inv.status)) {
      cashFlowBuckets[key].expenses += inv.subtotal || 0;
    }
  });

  const cashFlow = Object.values(cashFlowBuckets);

  const practiceCounts = {};
  cases.forEach((c) => {
    const area = categorizePracticeArea(c.title);
    practiceCounts[area] = (practiceCounts[area] || 0) + 1;
  });
  const totalCases = cases.length || 1;
  const practiceAreas = Object.entries(practiceCounts)
    .map(([label, count]) => ({
      label,
      count,
      percentage: Math.round((count / totalCases) * 100),
      color: PRACTICE_COLORS[label] || PRACTICE_COLORS.General,
    }))
    .sort((a, b) => b.count - a.count);

  const clientBilling = {};
  currentPeriodInvoices.forEach((inv) => {
    const cid = inv.client_id?._id?.toString() || inv.client_id?.toString();
    if (!cid) return;
    if (!clientBilling[cid]) {
      const client = inv.client_id?.name ? inv.client_id : clientMap[cid];
      clientBilling[cid] = {
        clientId: cid,
        name: client?.name || 'Unknown',
        type: inv.case_id?.title || 'Legal matter',
        industry: client?.company || 'Individual',
        billing: 0,
        paidBilling: 0,
        invoiceCount: 0,
        status: client?.status === 'inactive' ? 'Inactive' : 'Active',
      };
    }
    clientBilling[cid].billing += inv.total || 0;
    clientBilling[cid].invoiceCount += 1;
    if (inv.status === 'paid') clientBilling[cid].paidBilling += inv.total || 0;
    if (inv.status === 'pending') clientBilling[cid].status = 'Pending Review';
  });

  const prevClientBilling = {};
  previousPeriodInvoices.forEach((inv) => {
    const cid = inv.client_id?._id?.toString() || inv.client_id?.toString();
    if (!cid) return;
    prevClientBilling[cid] = (prevClientBilling[cid] || 0) + (inv.total || 0);
  });

  const topClients = Object.values(clientBilling)
    .map((row) => {
      const prev = prevClientBilling[row.clientId] || 0;
      const change = pctChange(row.billing, prev);
      return {
        ...row,
        billing: Math.round(row.billing),
        growth: change,
        growthLabel:
          change > 0 ? `+${Math.round(change)}%` : change < 0 ? `${Math.round(change)}%` : '→ 0%',
        growthUp: change > 0 ? true : change < 0 ? false : null,
      };
    })
    .sort((a, b) => b.billing - a.billing)
    .slice(0, 10);

  const monthlyRevenue = cashFlow.map(({ month, revenue }) => ({ month, revenue }));

  res.json({
    period: { months: monthCount, label: `Last ${monthCount} Months` },
    kpis: {
      totalRevenue: Math.round(totalRevenue),
      totalRevenueChange: pctChange(totalRevenue, prevTotalRevenue),
      monthlyRecurringRevenue: Math.round(monthlyRecurringRevenue),
      mrrChange: pctChange(monthlyRecurringRevenue, prevMrr),
      averageDealValue: Math.round(averageDealValue),
      avgDealChange: pctChange(averageDealValue, prevAvgDeal),
    },
    cashFlow,
    practiceAreas,
    topClients,
    monthlyRevenue,
  });
});
