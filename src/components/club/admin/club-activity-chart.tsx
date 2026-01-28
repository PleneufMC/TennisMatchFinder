'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface WeeklyActivity {
  week: string;
  matches: number;
}

interface ClubActivityChartProps {
  data: WeeklyActivity[];
}

export function ClubActivityChart({ data }: ClubActivityChartProps) {
  // Calculer la moyenne et la tendance
  const totalMatches = data.reduce((sum, d) => sum + d.matches, 0);
  const average = data.length > 0 ? (totalMatches / data.length).toFixed(1) : '0';
  
  // Tendance : comparer les 4 dernières semaines aux 4 précédentes
  const recentWeeks = data.slice(-4);
  const previousWeeks = data.slice(-8, -4);
  const recentTotal = recentWeeks.reduce((sum, d) => sum + d.matches, 0);
  const previousTotal = previousWeeks.reduce((sum, d) => sum + d.matches, 0);
  const trend = previousTotal > 0 
    ? Math.round(((recentTotal - previousTotal) / previousTotal) * 100)
    : 0;

  // Formater les labels de semaine (ex: "W04" -> "S4")
  const formattedData = data.map(d => ({
    ...d,
    weekLabel: d.week.replace(/.*W0?/, 'S'),
  }));

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">
            📈 Activité (12 dernières semaines)
          </CardTitle>
          <div className="text-sm text-muted-foreground">
            <span>Moyenne : <strong>{average}</strong> matchs/sem</span>
            <span className="mx-2">|</span>
            <span>
              Tendance : 
              <strong className={trend >= 0 ? 'text-green-600 ml-1' : 'text-red-600 ml-1'}>
                {trend >= 0 ? '+' : ''}{trend}%
              </strong>
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            Pas encore de données d&apos;activité
          </div>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={formattedData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="weekLabel" 
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length && payload[0]) {
                      const data = payload[0];
                      return (
                        <div className="rounded-lg border bg-background p-2 shadow-sm">
                          <div className="flex flex-col">
                            <span className="text-xs text-muted-foreground">
                              Semaine {(data.payload as { weekLabel: string })?.weekLabel}
                            </span>
                            <span className="font-bold">
                              {data.value} matchs
                            </span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar 
                  dataKey="matches" 
                  fill="hsl(var(--primary))"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
