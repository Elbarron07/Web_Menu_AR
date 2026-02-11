import { useState } from 'react';
import {
  Database, Download, Filter, TrendingDown,
  Eye, ShoppingCart, MousePointerClick, Zap, QrCode,
  Users, Clock, Award, ArrowRight
} from 'lucide-react';
import { AdminPageSkeleton } from '../components/skeletons/AdminPageSkeleton';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend, AreaChart, Area,
} from 'recharts';
import { useAdvancedAnalytics } from '../hooks/useAdvancedAnalytics';
import { exportToCSV } from '../utils/exportUtils';
import type { PeakHourCell } from '../../lib/adminApi';

// ─── Tooltip Styles ───
const tooltipStyle = {
  backgroundColor: 'rgba(15, 23, 42, 0.95)',
  border: 'none',
  borderRadius: '12px',
  boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
  padding: '12px 16px',
  color: '#F1F5F9',
  fontSize: '13px',
};

// ─── SECTION 1 : FUNNEL ───
const FunnelSection = ({ data }: { data: ReturnType<typeof useAdvancedAnalytics>['data'] }) => {
  if (!data?.funnel || data.funnel.length === 0) return null;

  const funnelChartData = data.funnel.map((step, i) => ({
    ...step,
    dropoff: i > 0 ? data.funnel[i - 1].rate - step.rate : 0,
  }));

  return (
    <Card variant="default" padding="lg">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Filter className="w-5 h-5 text-indigo-500" />
            Funnel de conversion
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Parcours : Session → Vue 3D → AR → Hotspot → Panier
          </p>
        </div>
        <Badge variant="info" size="sm">
          {data.funnel[data.funnel.length - 1].rate.toFixed(1)}% global
        </Badge>
      </div>

      {/* Visual Funnel Bars */}
      <div className="space-y-3 mb-8">
        {data.funnel.map((step, i) => (
          <div key={step.step} className="flex items-center gap-4">
            <div className="w-28 text-sm font-medium text-gray-700 dark:text-gray-300 text-right">
              {step.step}
            </div>
            <div className="flex-1 relative">
              <div className="h-10 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-700">
                <div
                  className="h-full rounded-xl transition-all duration-700 ease-out flex items-center px-3"
                  style={{
                    width: `${Math.max(step.rate, 3)}%`,
                    background: `linear-gradient(135deg, ${step.color}, ${step.color}CC)`,
                  }}
                >
                  <span className="text-white text-xs font-bold whitespace-nowrap drop-shadow">
                    {step.count.toLocaleString('fr-FR')}
                  </span>
                </div>
              </div>
            </div>
            <div className="w-16 text-right">
              <span className="text-sm font-bold" style={{ color: step.color }}>
                {step.rate.toFixed(1)}%
              </span>
            </div>
            {i > 0 && (
              <div className="w-20 text-right">
                <span className="text-xs text-red-400 flex items-center gap-0.5 justify-end">
                  <TrendingDown className="w-3 h-3" />
                  −{funnelChartData[i].dropoff.toFixed(1)}%
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Funnel as area chart */}
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={funnelChartData}>
          <defs>
            <linearGradient id="funnelGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366F1" stopOpacity={0.4} />
              <stop offset="100%" stopColor="#6366F1" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
          <XAxis dataKey="step" stroke="#94A3B8" fontSize={12} />
          <YAxis stroke="#94A3B8" fontSize={12} unit="%" />
          <Tooltip contentStyle={tooltipStyle} />
          <Area type="monotone" dataKey="rate" stroke="#6366F1" fill="url(#funnelGrad)" strokeWidth={2.5} name="Taux (%)" />
        </AreaChart>
      </ResponsiveContainer>
    </Card>
  );
};

// ─── SECTION 2 : ENGAGEMENT HEATMAP ───
const EngagementSection = ({ data }: { data: ReturnType<typeof useAdvancedAnalytics>['data'] }) => {
  if (!data?.engagementHeatmap || data.engagementHeatmap.length === 0) {
    return (
      <Card variant="default" padding="lg">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
          <Zap className="w-5 h-5 text-amber-500" />
          Engagement par plat
        </h2>
        <div className="text-center py-12 text-gray-500">Aucune donnée d'engagement</div>
      </Card>
    );
  }

  const maxScore = Math.max(...data.engagementHeatmap.map(i => i.engagementScore), 1);

  return (
    <Card variant="default" padding="lg">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500" />
            Engagement par plat
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Vues beaucoup mais peu commandés = à optimiser
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="border-b border-gray-200 dark:border-gray-700">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Plat</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Catégorie</th>
              <th className="px-3 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                <Eye className="w-3.5 h-3.5 mx-auto" />
              </th>
              <th className="px-3 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                <ShoppingCart className="w-3.5 h-3.5 mx-auto" />
              </th>
              <th className="px-3 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                <MousePointerClick className="w-3.5 h-3.5 mx-auto" />
              </th>
              <th className="px-3 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Conv.</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Score</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
            {data.engagementHeatmap.slice(0, 10).map((item, i) => {
              const scorePct = (item.engagementScore / maxScore) * 100;
              const scoreColor = scorePct > 70 ? '#10B981' : scorePct > 40 ? '#F59E0B' : '#EF4444';
              const hasConversionIssue = item.views > 5 && item.conversionRate < 10;

              return (
                <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2">
                      {i < 3 && (
                        <span className="text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: i === 0 ? '#FFD700' : i === 1 ? '#C0C0C0' : '#CD7F32', color: '#fff' }}>
                          {i + 1}
                        </span>
                      )}
                      <span className="font-medium text-sm text-gray-900 dark:text-white">{item.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-xs text-gray-500 dark:text-gray-400">{item.category}</td>
                  <td className="px-3 py-3.5 text-center text-sm text-gray-700 dark:text-gray-300">{item.views}</td>
                  <td className="px-3 py-3.5 text-center text-sm text-gray-700 dark:text-gray-300">{item.carts}</td>
                  <td className="px-3 py-3.5 text-center text-sm text-gray-700 dark:text-gray-300">{item.hotspots}</td>
                  <td className="px-3 py-3.5 text-center">
                    <span className={`text-sm font-semibold ${hasConversionIssue ? 'text-red-500' : 'text-green-500'}`}>
                      {item.conversionRate.toFixed(1)}%
                      {hasConversionIssue && <span className="ml-1 text-xs">⚠️</span>}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${scorePct}%`, backgroundColor: scoreColor }} />
                      </div>
                      <span className="text-xs font-bold" style={{ color: scoreColor }}>{item.engagementScore}</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
};

// ─── SECTION 3 : PEAK HOURS HEATMAP ───
const PeakHoursSection = ({ data }: { data: ReturnType<typeof useAdvancedAnalytics>['data'] }) => {
  if (!data?.peakHours || data.peakHours.length === 0) return null;

  const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
  const hours = Array.from({ length: 16 }, (_, i) => i + 8); // 8h–23h

  // Reorder from Dim-first to Lun-first
  const dayMapping: Record<string, number> = { 'Lun': 1, 'Mar': 2, 'Mer': 3, 'Jeu': 4, 'Ven': 5, 'Sam': 6, 'Dim': 0 };

  const getCellData = (day: string, hour: number): PeakHourCell | undefined => {
    const dayIndex = dayMapping[day];
    return data.peakHours.find(c => c.dayIndex === dayIndex && c.hour === hour);
  };

  const getHeatColor = (intensity: number): string => {
    if (intensity === 0) return 'bg-gray-100 dark:bg-gray-800';
    if (intensity < 0.2) return 'bg-emerald-100 dark:bg-emerald-900/30';
    if (intensity < 0.4) return 'bg-emerald-200 dark:bg-emerald-800/40';
    if (intensity < 0.6) return 'bg-amber-200 dark:bg-amber-700/40';
    if (intensity < 0.8) return 'bg-orange-300 dark:bg-orange-600/50';
    return 'bg-red-400 dark:bg-red-500/60';
  };

  // Find peak
  const peak = data.peakHours.reduce((max, cell) => cell.count > max.count ? cell : max, data.peakHours[0]);

  return (
    <Card variant="default" padding="lg">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-500" />
            Horaires de pointe
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Activité par heure et jour de la semaine
          </p>
        </div>
        {peak && peak.count > 0 && (
          <Badge variant="warning" size="sm">
            🔥 Pic : {peak.day} {peak.hour}h ({peak.count} events)
          </Badge>
        )}
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[600px]">
          {/* Header row */}
          <div className="flex items-center mb-1">
            <div className="w-12" />
            {hours.map(h => (
              <div key={h} className="flex-1 text-center text-xs text-gray-400 dark:text-gray-500 font-medium">
                {h}h
              </div>
            ))}
          </div>

          {/* Heatmap grid */}
          {days.map(day => (
            <div key={day} className="flex items-center mb-1">
              <div className="w-12 text-xs font-semibold text-gray-600 dark:text-gray-400">{day}</div>
              {hours.map(hour => {
                const cell = getCellData(day, hour);
                return (
                  <div key={`${day}-${hour}`} className="flex-1 px-0.5">
                    <div
                      className={`h-8 rounded-md ${getHeatColor(cell?.intensity || 0)} flex items-center justify-center transition-colors cursor-default`}
                      title={`${day} ${hour}h : ${cell?.count || 0} événements`}
                    >
                      {(cell?.count || 0) > 0 && (
                        <span className="text-[10px] font-bold text-gray-700 dark:text-gray-200">
                          {cell!.count}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}

          {/* Legend */}
          <div className="flex items-center justify-end gap-1 mt-3">
            <span className="text-xs text-gray-400 mr-1">Faible</span>
            {['bg-gray-100 dark:bg-gray-800', 'bg-emerald-100 dark:bg-emerald-900/30', 'bg-emerald-200 dark:bg-emerald-800/40', 'bg-amber-200 dark:bg-amber-700/40', 'bg-orange-300 dark:bg-orange-600/50', 'bg-red-400 dark:bg-red-500/60'].map((color, i) => (
              <div key={i} className={`w-6 h-4 rounded ${color}`} />
            ))}
            <span className="text-xs text-gray-400 ml-1">Fort</span>
          </div>
        </div>
      </div>
    </Card>
  );
};

// ─── SECTION 4 : COHORTS ───
const CohortsSection = ({ data }: { data: ReturnType<typeof useAdvancedAnalytics>['data'] }) => {
  if (!data?.cohorts || data.cohorts.length === 0) {
    return (
      <Card variant="default" padding="lg">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-purple-500" />
          Cohortes de sessions
        </h2>
        <div className="text-center py-12 text-gray-500">Aucune donnée de cohorte</div>
      </Card>
    );
  }

  const avgRetention = data.cohorts.length > 0
    ? (data.cohorts.reduce((sum, c) => sum + c.retentionRate, 0) / data.cohorts.length)
    : 0;

  return (
    <Card variant="default" padding="lg">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-500" />
            Cohortes de sessions
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Nouveaux vs récurrents par semaine
          </p>
        </div>
        <Badge variant={avgRetention > 20 ? 'success' : 'warning'} size="sm">
          Rétention moy. : {avgRetention.toFixed(1)}%
        </Badge>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data.cohorts}>
          <defs>
            <linearGradient id="newGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.9} />
              <stop offset="100%" stopColor="#8B5CF6" stopOpacity={0.6} />
            </linearGradient>
            <linearGradient id="retGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#06B6D4" stopOpacity={0.9} />
              <stop offset="100%" stopColor="#06B6D4" stopOpacity={0.6} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
          <XAxis dataKey="period" stroke="#94A3B8" fontSize={11} />
          <YAxis stroke="#94A3B8" fontSize={12} />
          <Tooltip contentStyle={tooltipStyle} />
          <Legend />
          <Bar dataKey="newSessions" fill="url(#newGrad)" radius={[6, 6, 0, 0]} name="Nouvelles sessions" stackId="a" />
          <Bar dataKey="returningSessions" fill="url(#retGrad)" radius={[6, 6, 0, 0]} name="Sessions récurrentes" stackId="a" />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
};

// ─── SECTION 5 : QR ANALYTICS ───
const QRAnalyticsSection = ({ data }: { data: ReturnType<typeof useAdvancedAnalytics>['data'] }) => {
  if (!data?.qrAnalytics || data.qrAnalytics.length === 0) {
    return (
      <Card variant="default" padding="lg">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
          <QrCode className="w-5 h-5 text-teal-500" />
          Performance QR Codes
        </h2>
        <div className="text-center py-12 text-gray-500">Aucun QR code trouvé</div>
      </Card>
    );
  }

  const totalScans = data.qrAnalytics.reduce((sum, qr) => sum + qr.scanCount, 0);
  const maxScans = Math.max(...data.qrAnalytics.map(qr => qr.scanCount), 1);
  const typeColors: Record<string, string> = {
    table: '#3B82F6',
    room: '#8B5CF6',
    delivery: '#10B981',
    takeaway: '#F59E0B',
    default: '#6B7280',
  };

  return (
    <Card variant="default" padding="lg">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <QrCode className="w-5 h-5 text-teal-500" />
            Performance QR Codes
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Scans par QR code et type
          </p>
        </div>
        <Badge variant="info" size="sm">
          {totalScans.toLocaleString('fr-FR')} scans au total
        </Badge>
      </div>

      {/* Type Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {Object.entries(
          data.qrAnalytics.reduce((acc, qr) => {
            const type = qr.type || 'default';
            acc[type] = (acc[type] || 0) + qr.scanCount;
            return acc;
          }, {} as Record<string, number>)
        ).map(([type, scans]) => (
          <div key={type} className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3 text-center">
            <div className="text-xs text-gray-500 dark:text-gray-400 uppercase font-medium mb-1">{type}</div>
            <div className="text-lg font-bold" style={{ color: typeColors[type] || typeColors.default }}>
              {(scans as number).toLocaleString('fr-FR')}
            </div>
          </div>
        ))}
      </div>

      {/* QR code list */}
      <div className="space-y-2">
        {data.qrAnalytics.slice(0, 8).map(qr => {
          const pct = (qr.scanCount / maxScans) * 100;
          const color = typeColors[qr.type] || typeColors.default;
          return (
            <div key={qr.id} className="flex items-center gap-3">
              <div className="w-32 text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                {qr.label}
              </div>
              <div
                className="w-14 text-center text-xs py-0.5 px-2 rounded-full text-white font-medium"
                style={{ backgroundColor: color }}
              >
                {qr.type}
              </div>
              <div className="flex-1 h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: color }} />
              </div>
              <div className="w-16 text-right text-sm font-bold text-gray-700 dark:text-gray-300">
                {qr.scanCount.toLocaleString('fr-FR')}
              </div>
              <div className="w-6">
                {!qr.isActive && <span className="text-xs text-red-400">●</span>}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};

// ─── SECTION 6 : ENGAGEMENT SCORE ───
const EngagementScoreSection = ({ data }: { data: ReturnType<typeof useAdvancedAnalytics>['data'] }) => {
  if (!data?.engagementHeatmap || data.engagementHeatmap.length === 0) return null;

  const top5 = data.engagementHeatmap.slice(0, 5);
  const bottom5 = data.engagementHeatmap.slice(-5).reverse();
  const maxScore = top5[0]?.engagementScore || 1;

  const ScoreCard = ({ item, rank }: { item: typeof top5[0]; rank: number }) => (
    <div className="flex items-center gap-3 py-2.5">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm ${rank <= 3 ? 'bg-gradient-to-br from-amber-400 to-orange-500' : 'bg-gray-400'}`}>
        #{rank}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-gray-900 dark:text-white truncate">{item.name}</div>
        <div className="text-xs text-gray-500 dark:text-gray-400">{item.category}</div>
      </div>
      <div className="text-right">
        <div className="text-lg font-bold text-gray-900 dark:text-white">{item.engagementScore}</div>
        <div className="text-xs text-gray-400">pts</div>
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Top performers */}
      <Card variant="default" padding="lg">
        <div className="flex items-center gap-2 mb-4">
          <Award className="w-5 h-5 text-amber-500" />
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Top 5 — Meilleur engagement</h3>
        </div>
        <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
          {top5.map((item, i) => (
            <ScoreCard key={item.id} item={item} rank={i + 1} />
          ))}
        </div>

        {/* Score bar */}
        <div className="mt-4 space-y-1.5">
          {top5.map(item => (
            <div key={item.id} className="flex items-center gap-2">
              <span className="w-20 text-xs text-gray-500 truncate">{item.name}</span>
              <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500"
                  style={{ width: `${(item.engagementScore / maxScore) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Bottom performers */}
      <Card variant="default" padding="lg">
        <div className="flex items-center gap-2 mb-4">
          <TrendingDown className="w-5 h-5 text-red-500" />
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Bottom 5 — À optimiser</h3>
        </div>

        {bottom5.length === 0 ? (
          <div className="text-center py-12 text-gray-400">Pas assez de données</div>
        ) : (
          <>
            <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
              {bottom5.map((item, i) => (
                <div key={item.id} className="flex items-center gap-3 py-2.5">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-red-50 dark:bg-red-900/30 text-red-500 font-bold text-sm">
                    {data.engagementHeatmap.length - bottom5.length + i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-gray-900 dark:text-white truncate">{item.name}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{item.category}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-bold text-red-500">{item.engagementScore} pts</div>
                    <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-xs text-gray-400">Conv. {item.conversionRate.toFixed(1)}%</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-xl">
              <p className="text-xs text-red-600 dark:text-red-400">
                💡 Ces plats ont un faible engagement. Envisagez d'améliorer leurs modèles 3D, descriptions ou positionnement dans le menu.
              </p>
            </div>
          </>
        )}
      </Card>
    </div>
  );
};

// ─── MAIN PAGE ───
export const DataAnalytics = () => {
  const [timeRange, setTimeRange] = useState('30d');
  const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
  const { data, loading, error } = useAdvancedAnalytics(days);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
            <Database className="w-8 h-8" />
            Analyses avancées
          </h1>
          <p className="text-gray-600 dark:text-gray-400">Funnel, heatmaps, cohortes et scores d'engagement</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="7d">7 derniers jours</option>
            <option value="30d">30 derniers jours</option>
            <option value="90d">90 derniers jours</option>
          </select>
          <Button icon={<Download className="w-4 h-4" />} onClick={() => {
            if (data?.engagementHeatmap) {
              exportToCSV(data.engagementHeatmap, 'engagement_analytics', [
                { key: 'name', header: 'Plat' },
                { key: 'category', header: 'Catégorie' },
                { key: 'views', header: 'Vues' },
                { key: 'carts', header: 'Paniers' },
                { key: 'hotspots', header: 'Hotspots' },
                { key: 'conversionRate', header: 'Taux conversion (%)' },
                { key: 'engagementScore', header: 'Score engagement' },
              ]);
            }
          }}>
            Exporter
          </Button>
        </div>
      </div>

      {loading && <AdminPageSkeleton variant="analytics" />}

      {error && (
        <div className="text-center py-12 text-red-600">Erreur : {error}</div>
      )}

      {!loading && !error && data && (
        <>
          {/* 1. Funnel de conversion */}
          <FunnelSection data={data} />

          {/* 2. Engagement heatmap + 6. Score */}
          <EngagementSection data={data} />

          {/* 3. Peak hours + 4. Cohorts side by side */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <PeakHoursSection data={data} />
            <CohortsSection data={data} />
          </div>

          {/* 5. QR Analytics */}
          <QRAnalyticsSection data={data} />

          {/* 6. Engagement Score Rankings */}
          <EngagementScoreSection data={data} />
        </>
      )}
    </div>
  );
};
