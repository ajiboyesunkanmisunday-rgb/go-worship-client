'use client';

import { useMemo, useState, useEffect } from 'react';
import { SheetPage } from '../ui/sheet-page';
import Image from 'next/image';
import { cn, formatCurrency } from '@/lib/utils';
import { Button } from '../ui/button';
import { getCustomerPaymentById, type PaymentStatusResponse } from '@/lib/api/customer';
import { USE_LIVE_API } from '@/lib/api/config';
import { getTenantBranding, getTenantOrganization } from '@/lib/api/tenant';

type Props = {
  isIntercepted?: boolean;
  id: string;
};

export function GivingsDetail({ isIntercepted = false, id }: Props) {
  const returnUrl = useMemo(
    () => (isIntercepted ? undefined : '/dashboard/givings'),
    [isIntercepted]
  );
  const [payment, setPayment] = useState<PaymentStatusResponse | null>(null);
  const [orgName, setOrgName] = useState(USE_LIVE_API ? '' : 'Celebration Church Int.');
  const [orgLocation, setOrgLocation] = useState(USE_LIVE_API ? '' : 'Ontario Canada, Canada City');
  const [orgPhone, setOrgPhone] = useState(USE_LIVE_API ? '' : '+127-987-67543');
  const [orgEmail, setOrgEmail] = useState(USE_LIVE_API ? '' : 'info@churchname.org');
  const [orgWeb, setOrgWeb] = useState(USE_LIVE_API ? '' : 'www.churchname.org');

  useEffect(() => {
    if (!USE_LIVE_API) return;
    getTenantBranding().then((b) => {
      if (b.organizationName) setOrgName(b.organizationName);
    }).catch(() => {});
    getTenantOrganization()
      .then((o) => {
        const loc = o.city ?? o.location ?? o.address ?? o.country;
        if (loc) setOrgLocation(loc);
        if (o.phone) setOrgPhone(o.phone);
        if (o.email) setOrgEmail(o.email);
        const web = o.website ?? o.websiteUrl;
        if (web) setOrgWeb(web.replace(/^https?:\/\//, ''));
      }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!USE_LIVE_API) return;
    getCustomerPaymentById(id).then(setPayment).catch(() => {});
  }, [id]);

  const amount = payment?.amount ?? 25;
  const dateStr = payment
    ? new Date(String(payment['paidAt'] ?? payment['requestedAt'] ?? '')).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : (USE_LIVE_API ? '—' : 'January 12, 2025');
  const status = payment?.status
    ? payment.status.charAt(0).toUpperCase() + payment.status.slice(1).toLowerCase()
    : (USE_LIVE_API ? '—' : 'Successful');
  const reference = payment?.paymentReference ?? payment?.id ?? (USE_LIVE_API ? '—' : 'TXN-02939493');
  const statusColor = status.toUpperCase() === 'SUCCEEDED' || status.toLowerCase() === 'successful' ? '#22A45D' : '#ff8d28';

  const donorName = payment
    ? String(payment['donorName'] ?? payment['payerName'] ?? payment['customerName'] ?? payment['fullName'] ?? (USE_LIVE_API ? '—' : 'Aderemi Doe'))
    : (USE_LIVE_API ? '—' : 'Aderemi Doe');
  const donorEmail = payment
    ? String(payment['donorEmail'] ?? payment['payerEmail'] ?? payment['customerEmail'] ?? payment['email'] ?? (USE_LIVE_API ? '—' : 'aderemidoe@email.com'))
    : (USE_LIVE_API ? '—' : 'aderemidoe@email.com');
  const donorPhone = payment
    ? String(payment['donorPhone'] ?? payment['payerPhone'] ?? payment['customerPhone'] ?? payment['phone'] ?? payment['mobilePhone'] ?? (USE_LIVE_API ? '—' : '+234 812 345 6789'))
    : (USE_LIVE_API ? '—' : '+234 812 345 6789');

  return (
    <SheetPage className="w-full max-w-[665px]! gap-0" backLink={returnUrl}>
      <div className="w-full h-full overflow-y-auto flex flex-col justify-between items-center gap-4">
        <div
          className={cn(
            'w-full h-fit flex flex-col justify-between items-center gap-8',
            'px-6 pt-[50px] md:pt-[80px] md:px-[60px] pb-6'
          )}
        >
          <Image
            src="/Layer_1.svg"
            alt="Church Logo"
            width={174}
            height={30.72}
            className="shrink-0 aspect-174/30.72 w-[146px] md:w-[174px]"
          />

          <div className="w-full flex flex-col justify-start items-start gap-0 leading-[143%] tracking-[0%]">
            <span className="font-bold">{orgName}</span>
            <span>{orgLocation}</span>
            <a
              href={`tel:${orgPhone}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {orgPhone}
            </a>
            <a
              href={`mailto:${orgEmail}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {orgEmail}
            </a>
            <a
              href={`https://${orgWeb}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {orgWeb}
            </a>
          </div>

          <div className="w-full flex flex-col justify-start items-end">
            <span className="text-[#243F84] font-bold md:text-[18px]">
              Donor Information
            </span>
            <span>{donorName}</span>
            <a
              href={`mailto:${donorEmail}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {donorEmail}
            </a>

            <a
              href={`tel:${donorPhone}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {donorPhone}
            </a>
          </div>

          <div className="w-full border-y border-[#8C8C8C] py-2">
            <span className="font-bold text-[#243F84] md:text-[18px]">
              Giving Receipt
            </span>
          </div>

          <div className="w-full flex flex-col justify-start items-start gap-4">
            <div className="w-full flex justify-between items-center gap-4">
              <span>Donation Date</span>
              <span className="text-right">{dateStr}</span>
            </div>

            <div className="w-full flex justify-between items-center gap-4">
              <span>Amount Given</span>
              <span className="text-right">{formatCurrency(amount)}</span>
            </div>

            <div className="w-full flex justify-between items-center gap-4">
              <span>Fund/Campaign</span>
              <span className="text-right">{String(payment?.['purpose'] ?? (USE_LIVE_API ? '—' : 'General Offering'))}</span>
            </div>

            <div className="w-full flex justify-between items-center gap-4">
              <span>Donation Type</span>
              <span className="text-right">{USE_LIVE_API ? (String(payment?.['donationType'] ?? '—')) : 'One-time'}</span>
            </div>

            <div className="w-full flex justify-between items-center gap-4">
              <span>Payment Method</span>
              <span className="text-right">{String(payment?.['gatewayType'] ?? (USE_LIVE_API ? '—' : 'Debit Card (Visa •••• 2920)'))}</span>
            </div>

            <div className="w-full flex justify-between items-center gap-4">
              <span>Transaction ID</span>
              <span className="text-right">{reference}</span>
            </div>

            <div className="w-full flex justify-between items-center gap-4">
              <span>Status</span>
              <span className="flex items-center gap-2 text-right">
                <span className="size-2 rounded-full" style={{ backgroundColor: statusColor }} />
                {status}
              </span>
            </div>
          </div>

          <div className="w-full flex flex-col justify-start items-start gap-4">
            <div className="bg-[#EDF3FF] w-full h-[41.5px] md:h-[60px] p-4 md:p-6 flex justify-between items-center gap-4">
              <span className="font-bold text-[#243F84] md:text-[18px] leading-[100%] tracking-[0%]">
                Subtotal:
              </span>
              <span className="font-bold leading-[100%] tracking-[0%] text-[18px]">
                {formatCurrency(amount)}
              </span>
            </div>

            <Button
              className="w-full h-[41.5px] md:h-[60px] font-bold text-[16px]! md:text-[18px]!"
              size="lg"
            >
              Download Receipt
            </Button>
          </div>

          <p className="w-full max-w-[339px] text-[14px] text-center font-light leading-[100%] tracking-[0%]">
            Thank you for your generous giving. Your support helps us continue
            our mission and outreach.
          </p>
        </div>

        <div
          className={cn(
            'bg-[#333333] w-full min-h-[60px] py-6',
            'flex flex-col justify-center items-center text-[12px] font-light text-white'
          )}
        >
          <span>Powered by Go-Worship Giving</span>
          <span>Thank you for supporting the ministry</span>
        </div>
      </div>
    </SheetPage>
  );
}
