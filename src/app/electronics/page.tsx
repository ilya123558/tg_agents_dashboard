'use client';

import { useState } from 'react';
import { useGetLeadsQuery } from '@/entities/Lead';
import { useGetSellersQuery } from '@/entities/Seller';
import { StatsPanel } from '@/widgets/StatsPanel';
import { LeadsTable } from '@/widgets/LeadsTable';
import { SellersTable } from '@/widgets/SellersTable';
import { GroupsStats } from '@/widgets/GroupsStats';
import { ConnectionSchema } from '@/widgets/ConnectionSchema';

type Tab = 'leads' | 'sellers' | 'schema';

export default function ChinaPage() {
  const [tab, setTab] = useState<Tab>('leads');
  const { data: leadsData, isLoading: leadsLoading, isError: leadsError, refetch: refetchLeads } = useGetLeadsQuery();
  const { data: sellersData, isLoading: sellersLoading, isError: sellersError, refetch: refetchSellers } = useGetSellersQuery();

  const isLoading = leadsLoading || sellersLoading;
  const isError = leadsError || sellersError;

  function refetch() {
    refetchLeads();
    refetchSellers();
  }

  return (
    <>
      <header className="border-b border-white/5 px-4 md:px-6 py-4 flex items-center justify-between sticky top-0 bg-[#0f0f0f]/90 backdrop-blur-sm z-30">
        <div className="flex items-center gap-2">
          <span className="text-lg">📱</span>
          <span className="font-medium text-white text-sm">Электроника</span>
        </div>
        <button onClick={() => refetch()}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span className="hidden sm:inline">Обновить</span>
        </button>
      </header>
      <main className="px-4 md:px-6 py-5 space-y-4 max-w-[1400px] mx-auto w-full">
        {isLoading && <div className="flex items-center justify-center py-20 text-gray-600 text-sm gap-2">
          <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Загрузка...
        </div>}
        {isError && <div className="text-center py-20 text-red-500 text-sm">Ошибка загрузки</div>}
        {(leadsData || sellersData) && (
          <>
            <StatsPanel leads={leadsData?.leads ?? []} sellers={sellersData?.sellers ?? []} />

            {/* Tabs */}
            <div className="flex items-center gap-1 border-b border-white/5 pb-0">
              <button
                onClick={() => setTab('leads')}
                className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
                  tab === 'leads'
                    ? 'border-blue-500 text-white'
                    : 'border-transparent text-gray-500 hover:text-gray-300'
                }`}
              >
                Лиды
                {leadsData && (
                  <span className="ml-1.5 text-xs text-gray-600">{leadsData.leads.length}</span>
                )}
              </button>
              <button
                onClick={() => setTab('sellers')}
                className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
                  tab === 'sellers'
                    ? 'border-orange-500 text-white'
                    : 'border-transparent text-gray-500 hover:text-gray-300'
                }`}
              >
                Продавцы
                {sellersData && (
                  <span className="ml-1.5 text-xs text-gray-600">{sellersData.sellers.length}</span>
                )}
              </button>
              <button
                onClick={() => setTab('schema')}
                className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
                  tab === 'schema'
                    ? 'border-purple-500 text-white'
                    : 'border-transparent text-gray-500 hover:text-gray-300'
                }`}
              >
                Связи
              </button>
            </div>

            {tab === 'leads' && leadsData && (
              <div className="flex flex-col lg:flex-row gap-4 items-start">
                <div className="flex-1 min-w-0 w-full">
                  <LeadsTable leads={leadsData.leads} />
                </div>
                <div className="w-full lg:w-72 lg:shrink-0 lg:sticky lg:top-20">
                  <GroupsStats leads={leadsData.leads} />
                </div>
              </div>
            )}

            {tab === 'sellers' && sellersData && (
              <div className="flex flex-col lg:flex-row gap-4 items-start">
                <div className="flex-1 min-w-0 w-full">
                  <SellersTable sellers={sellersData.sellers} />
                </div>
                <div className="w-full lg:w-72 lg:shrink-0 lg:sticky lg:top-20">
                  <GroupsStats leads={sellersData.sellers} label="продавцов" />
                </div>
              </div>
            )}

            {tab === 'schema' && leadsData && sellersData && (
              <ConnectionSchema
                leads={leadsData.leads}
                sellers={sellersData.sellers}
              />
            )}
          </>
        )}
      </main>
    </>
  );
}
