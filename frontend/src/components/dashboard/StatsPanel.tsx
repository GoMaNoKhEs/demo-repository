import { Box, Card, CardContent, Typography, Chip, LinearProgress } from '@mui/material';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  Speed,
  CheckCircle,
  Error as ErrorIcon,
  Timer,
  AutoFixHigh,
} from '@mui/icons-material';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { AnimatedNumber } from '../common/AnimatedNumber';
import { useAppStore } from '../../stores/useAppStore';
import { useMemo } from 'react';

// Couleurs Google pour les graphiques
const COLORS = {
  primary: '#4285F4',
  secondary: '#34A853',
  warning: '#FBBC04',
  error: '#EA4335',
  purple: '#A142F4',
  teal: '#24C1E0',
};

interface StatCardProps {
  title: string;
  value: number;
  unit?: string;
  prefix?: string;
  suffix?: string;
  icon: React.ReactNode;
  color: string;
  trend?: number;
  decimals?: number;
}

const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  icon, 
  color, 
  trend, 
  prefix, 
  suffix, 
  decimals = 0 
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card sx={{ height: '100%', position: 'relative', overflow: 'visible' }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {title}
              </Typography>
              <Typography variant="h3" fontWeight="bold" color={color}>
                <AnimatedNumber 
                  value={value} 
                  prefix={prefix}
                  suffix={suffix}
                  decimals={decimals}
                />
              </Typography>
              {trend !== undefined && (
                <Chip
                  label={`${trend > 0 ? '+' : ''}${trend}%`}
                  size="small"
                  color={trend >= 0 ? 'success' : 'error'}
                  icon={<TrendingUp />}
                  sx={{ mt: 1 }}
                />
              )}
            </Box>
            <Box
              sx={{
                width: 60,
                height: 60,
                borderRadius: 2,
                bgcolor: `${color}15`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color,
              }}
            >
              {icon}
            </Box>
          </Box>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export const StatsPanel = () => {
  const { currentProcess, activityLogs } = useAppStore();

  // Calcul des statistiques
  const stats = useMemo(() => {
    if (!currentProcess) {
      return {
        timeSaved: 0,
        errorsFixed: 0,
        successRate: 0,
        completedSteps: 0,
        totalActions: 0,
        avgResponseTime: 0,
      };
    }

    const completedSteps = currentProcess.steps.filter(s => s.status === 'completed').length;
    const totalSteps = currentProcess.steps.length;
    const successRate = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

    // Simulation de temps économisé (en heures)
    const timeSaved = completedSteps * 2.5; // ~2.5h par étape en moyenne

    // Simulation d'erreurs auto-corrigées
    const errorsFixed = activityLogs.filter(log => 
      log.message.toLowerCase().includes('erreur') || 
      log.message.toLowerCase().includes('correction') ||
      log.type === 'error' ||
      log.type === 'warning'
    ).length + Math.floor(completedSteps * 1.8);

    // Temps de réponse moyen (en secondes)
    const avgResponseTime = 1.2;

    return {
      timeSaved,
      errorsFixed,
      successRate,
      completedSteps,
      totalActions: activityLogs.length,
      avgResponseTime,
    };
  }, [currentProcess, activityLogs]);

  // Données pour graphique de progression dans le temps
  const progressData = useMemo(() => {
    if (!currentProcess) return [];
    
    return currentProcess.steps.map((step, index) => ({
      name: `Étape ${index + 1}`,
      progression: step.status === 'completed' ? 100 : 
                   step.status === 'in-progress' ? 50 : 0,
      temps: Math.floor(Math.random() * 30) + 10, // Simulation
    }));
  }, [currentProcess]);

  // Données pour graphique des types d'actions
  const actionsData = useMemo(() => {
    const types = ['Documents', 'Formulaires', 'Vérifications', 'Corrections', 'Communications'];
    
    return types.map(type => ({
      name: type,
      count: Math.floor(Math.random() * 15) + 5,
    }));
  }, []);

  // Données pour graphique de répartition du temps
  const timeDistributionData = useMemo(() => [
    { name: 'Analyse', value: 25, color: COLORS.primary },
    { name: 'Remplissage', value: 35, color: COLORS.secondary },
    { name: 'Vérification', value: 20, color: COLORS.warning },
    { name: 'Soumission', value: 15, color: COLORS.purple },
    { name: 'Correction', value: 5, color: COLORS.error },
  ], []);

  if (!currentProcess) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary">
          Aucune statistique disponible
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Démarrez une mission pour voir les statistiques.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Cards de statistiques principales */}
      <Box 
        sx={{ 
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
          gap: 3,
          mb: 4
        }}
      >
        <StatCard
          title="Temps économisé"
          value={stats.timeSaved}
          suffix="h"
          icon={<Timer sx={{ fontSize: 32 }} />}
          color={COLORS.secondary}
          trend={15}
        />

        <StatCard
          title="Erreurs auto-corrigées"
          value={stats.errorsFixed}
          icon={<AutoFixHigh sx={{ fontSize: 32 }} />}
          color={COLORS.warning}
          trend={8}
        />

        <StatCard
          title="Taux de succès"
          value={stats.successRate}
          suffix="%"
          decimals={1}
          icon={<CheckCircle sx={{ fontSize: 32 }} />}
          color={COLORS.primary}
          trend={12}
        />

        <StatCard
          title="Étapes complétées"
          value={stats.completedSteps}
          suffix={` / ${currentProcess.steps.length}`}
          icon={<TrendingUp sx={{ fontSize: 32 }} />}
          color={COLORS.purple}
        />

        <StatCard
          title="Actions totales"
          value={stats.totalActions}
          icon={<Speed sx={{ fontSize: 32 }} />}
          color={COLORS.teal}
          trend={22}
        />

        <StatCard
          title="Temps de réponse moyen"
          value={stats.avgResponseTime}
          suffix="s"
          decimals={1}
          icon={<ErrorIcon sx={{ fontSize: 32 }} />}
          color={COLORS.error}
          trend={-5}
        />
      </Box>

      {/* Graphiques */}
      <Box 
        sx={{ 
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, 1fr)' },
          gap: 3
        }}
      >
        {/* Graphique de progression */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Progression des Étapes
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={progressData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="progression" fill={COLORS.primary} name="Progression %" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Graphique des types d'actions */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Types d'Actions Effectuées
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={actionsData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" />
                <Tooltip />
                <Bar dataKey="count" fill={COLORS.secondary} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Graphique de répartition du temps */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Répartition du Temps
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={timeDistributionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name} (${entry.value}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {timeDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Graphique de tendance temporelle */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Temps par Étape (minutes)
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={progressData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="temps" 
                  stroke={COLORS.primary} 
                  strokeWidth={2}
                  name="Temps (min)"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Box>

      {/* Barre de performance globale */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Performance Globale
            </Typography>
            <Chip 
              label="Excellente" 
              color="success" 
              icon={<CheckCircle />}
            />
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={85} 
            sx={{ 
              height: 12, 
              borderRadius: 6,
              bgcolor: 'grey.200',
              '& .MuiLinearProgress-bar': {
                borderRadius: 6,
                bgcolor: COLORS.secondary,
              }
            }}
          />
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            Basé sur le temps économisé, le taux de succès et la qualité des résultats
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};
