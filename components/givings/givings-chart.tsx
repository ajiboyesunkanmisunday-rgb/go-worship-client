'use client';
import { Bar, BarChart, XAxis, YAxis } from 'recharts';
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { cn, formatAbbreviatedNumber, formatCurrency } from '@/lib/utils';

const chartData = [
  { month: 'January', amount: 1200 },
  { month: 'February', amount: 900 },
  { month: 'March', amount: 1600 },
  { month: 'April', amount: 750 },
  { month: 'May', amount: 1400 },
  { month: 'June', amount: 1850 },
  { month: 'July', amount: 1100 },
  { month: 'August', amount: 1350 },
  { month: 'September', amount: 600 },
  { month: 'October', amount: 1700 },
  { month: 'November', amount: 950 },
  { month: 'December', amount: 2000 },
];

const chartConfig = {
  givings: {
    label: 'Amount Given',
    color: '#243F84',
  },
} satisfies ChartConfig;

export function GivingsChart() {
  const totalAmount = chartData.reduce((sum, item) => sum + item.amount, 0);

  return (
    <div className="w-full overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
      <div
        className={cn(
          'w-full bg-white rounded-[6px]',
          'p-4 sm:p-6 md:p-8 lg:p-10 xl:p-12',
          'pt-6 sm:pt-8 md:pt-10 lg:pt-12 xl:pt-14',
          'pb-6 sm:pb-8 md:pb-10 lg:pb-[30px] xl:pb-[40px]',
          'min-w-[600px] sm:min-w-0',
          'flex flex-col gap-4 sm:gap-6 md:gap-8'
        )}
      >
        <div className="w-full flex flex-col gap-1 sm:gap-2">
          <p className="text-[12px] sm:text-[13px] md:text-[14px] font-medium leading-[150%]">
            Total Given
          </p>
          <h1 className="text-[24px] sm:text-[28px] md:text-[32px] lg:text-[36px] xl:text-[40px] font-bold leading-[100%] tracking-[0%] text-[#232323]">
            {formatCurrency(totalAmount)}
          </h1>
        </div>

        <ChartContainer
          config={chartConfig}
          className="w-full h-[240px] sm:h-[260px] md:h-[280px]"
        >
          <BarChart
            accessibilityLayer
            data={chartData}
            margin={{
              top: 12,
              right: 12,
              bottom: 8,
              left: 8,
            }}
          >
            <XAxis
              dataKey="month"
              tickLine={{ strokeDasharray: '4 2' }}
              tickMargin={8}
              axisLine={{ strokeDasharray: '4 2' }}
              tickFormatter={(value) => value.slice(0, 3)}
              tick={{ fontSize: 11 }}
              className="text-[11px] sm:text-xs md:text-sm"
              interval={0}
            />

            <YAxis
              dataKey="amount"
              tickLine={{ strokeDasharray: '4 2' }}
              tickMargin={8}
              axisLine={{ strokeDasharray: '4 2' }}
              tickFormatter={(value) => `$${formatAbbreviatedNumber(value)}`}
              orientation="right"
              tick={{ fontSize: 11 }}
              className="text-[11px] sm:text-xs md:text-sm"
              width={60}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value) =>
                    `${formatCurrency(value as number)} Given`
                  }
                />
              }
            />
            <Bar
              dataKey="amount"
              fill="var(--color-givings)"
              // radius={[4, 4, 0, 0]}
              barSize={29}
            />
          </BarChart>
        </ChartContainer>
      </div>
    </div>
  );
}
