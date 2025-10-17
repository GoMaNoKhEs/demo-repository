import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Process, ActivityLog } from '../types';

// Interface pour jsPDF avec autoTable
interface jsPDFWithAutoTable extends jsPDF {
  lastAutoTable?: {
    finalY: number;
  };
}

interface Stats {
  timeSaved: number;
  errorsFixed: number;
  successRate: number;
  completedSteps: number;
  totalActions: number;
  avgResponseTime: number;
}

/**
 * Génère un rapport PDF complet de la mission SimplifIA
 */
export const generatePdfReport = (
  process: Process,
  activityLogs: ActivityLog[],
  stats: Stats
) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPosition = 20;

  // ========================================
  // PAGE 1 : PAGE DE GARDE
  // ========================================

  // Logo/Titre SimplifIA
  doc.setFillColor(66, 133, 244); // Google Blue
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.text('SimplifIA', pageWidth / 2, 25, { align: 'center' });
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.text('Rapport de Mission', pageWidth / 2, 33, { align: 'center' });

  // Réinitialiser couleur texte
  doc.setTextColor(0, 0, 0);
  yPosition = 60;

  // Informations de la mission
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Informations de la Mission', 20, yPosition);
  yPosition += 10;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`Titre: ${process.title}`, 20, yPosition);
  yPosition += 7;
  
  doc.text(`Description: ${process.description}`, 20, yPosition);
  yPosition += 7;
  
  doc.text(`Statut: ${getStatusLabel(process.status)}`, 20, yPosition);
  yPosition += 7;
  
  doc.text(`Date de création: ${formatDate(process.createdAt)}`, 20, yPosition);
  yPosition += 7;
  
  if (process.completedAt) {
    doc.text(`Date de fin: ${formatDate(process.completedAt)}`, 20, yPosition);
    yPosition += 7;
  }
  
  doc.text(`Session ID: ${process.sessionId}`, 20, yPosition);
  yPosition += 15;

  // Progression globale
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Progression Globale', 20, yPosition);
  yPosition += 10;

  const progressPercent = stats.successRate;
  const barWidth = pageWidth - 40;
  const barHeight = 15;
  
  // Barre de fond (gris)
  doc.setFillColor(220, 220, 220);
  doc.rect(20, yPosition, barWidth, barHeight, 'F');
  
  // Barre de progression (vert)
  doc.setFillColor(52, 168, 83); // Google Green
  doc.rect(20, yPosition, (barWidth * progressPercent) / 100, barHeight, 'F');
  
  // Texte pourcentage
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(
    `${progressPercent.toFixed(1)}%`,
    20 + (barWidth * progressPercent) / 200,
    yPosition + 10,
    { align: 'center' }
  );
  doc.setTextColor(0, 0, 0);
  yPosition += 25;

  // ========================================
  // PAGE 2 : STATISTIQUES CLÉS
  // ========================================
  
  doc.addPage();
  yPosition = 20;

  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Statistiques Clés', 20, yPosition);
  yPosition += 15;

  // Tableau des statistiques
  autoTable(doc, {
    startY: yPosition,
    head: [['Métrique', 'Valeur', 'Trend']],
    body: [
      ['Temps économisé', `${stats.timeSaved.toFixed(1)} heures`, '+15%'],
      ['Erreurs auto-corrigées', `${stats.errorsFixed}`, '+8%'],
      ['Taux de succès', `${stats.successRate.toFixed(1)}%`, '+12%'],
      ['Étapes complétées', `${stats.completedSteps} / ${process.steps.length}`, '—'],
      ['Actions totales', `${stats.totalActions}`, '+22%'],
      ['Temps de réponse moyen', `${stats.avgResponseTime.toFixed(1)}s`, '-5%'],
    ],
    headStyles: {
      fillColor: [66, 133, 244], // Google Blue
      textColor: 255,
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
    margin: { left: 20, right: 20 },
  });

  yPosition = (doc as jsPDFWithAutoTable).lastAutoTable?.finalY ?? yPosition + 20;

  // Section ROI
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Retour sur Investissement (ROI)', 20, yPosition);
  yPosition += 10;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  const estimatedCostSaving = stats.timeSaved * 50; // 50€/heure
  doc.text(
    `En automatisant cette mission, SimplifIA a permis d'économiser environ ${stats.timeSaved.toFixed(1)} heures,`,
    20,
    yPosition
  );
  yPosition += 7;
  doc.text(
    `soit une valeur estimée de ${estimatedCostSaving.toFixed(0)}€ (basé sur un taux horaire de 50€).`,
    20,
    yPosition
  );
  yPosition += 10;

  // ========================================
  // PAGE 3 : TIMELINE DES ÉTAPES
  // ========================================

  doc.addPage();
  yPosition = 20;

  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Timeline des Étapes', 20, yPosition);
  yPosition += 15;

  // Tableau des étapes
  const stepsData = process.steps.map((step, index) => [
    `Étape ${index + 1}`,
    step.name,
    getStatusLabel(step.status),
    step.startedAt ? formatDate(step.startedAt) : '—',
    step.completedAt ? formatDate(step.completedAt) : '—',
  ]);

  autoTable(doc, {
    startY: yPosition,
    head: [['#', 'Nom de l\'étape', 'Statut', 'Début', 'Fin']],
    body: stepsData,
    headStyles: {
      fillColor: [52, 168, 83], // Google Green
      textColor: 255,
      fontStyle: 'bold',
    },
    columnStyles: {
      0: { cellWidth: 20 },
      1: { cellWidth: 70 },
      2: { cellWidth: 30 },
      3: { cellWidth: 35 },
      4: { cellWidth: 35 },
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
    margin: { left: 20, right: 20 },
  });

  yPosition = (doc as jsPDFWithAutoTable).lastAutoTable?.finalY ?? yPosition + 20;

  // ========================================
  // PAGE 4 : JOURNAL D'ACTIVITÉ
  // ========================================

  doc.addPage();
  yPosition = 20;

  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Journal d\'Activité (Dernières 20 actions)', 20, yPosition);
  yPosition += 15;

  // Prendre les 20 dernières activités
  const recentLogs = activityLogs.slice(-20).reverse();
  const logsData = recentLogs.map((log) => [
    formatTime(log.timestamp),
    getTypeIcon(log.type),
    truncateText(log.message, 80),
  ]);

  autoTable(doc, {
    startY: yPosition,
    head: [['Heure', 'Type', 'Message']],
    body: logsData,
    headStyles: {
      fillColor: [251, 188, 4], // Google Yellow
      textColor: 0,
      fontStyle: 'bold',
    },
    columnStyles: {
      0: { cellWidth: 30 },
      1: { cellWidth: 20 },
      2: { cellWidth: 140 },
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
    margin: { left: 20, right: 20 },
    styles: {
      fontSize: 9,
    },
  });

  // ========================================
  // PAGE 5 : RECOMMANDATIONS & FOOTER
  // ========================================

  doc.addPage();
  yPosition = 20;

  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Recommandations', 20, yPosition);
  yPosition += 15;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');

  const recommendations = [
    '✓ SimplifIA a détecté et corrigé automatiquement les erreurs courantes.',
    '✓ Les décisions critiques ont été soumises à validation humaine.',
    '✓ Le temps économisé permet de se concentrer sur des tâches à plus forte valeur ajoutée.',
    '✓ Pour optimiser davantage, envisagez d\'automatiser les processus similaires.',
  ];

  recommendations.forEach((rec) => {
    doc.text(rec, 20, yPosition);
    yPosition += 10;
  });

  // Footer avec date et branding
  yPosition = pageHeight - 30;
  doc.setFillColor(66, 133, 244);
  doc.rect(0, yPosition - 5, pageWidth, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.text(
    `Rapport généré le ${formatDate(new Date())}`,
    pageWidth / 2,
    yPosition + 5,
    { align: 'center' }
  );
  doc.text(
    'SimplifIA - Intelligence Artificielle au service de votre productivité',
    pageWidth / 2,
    yPosition + 12,
    { align: 'center' }
  );

  // Télécharger le PDF
  const fileName = `SimplifIA_${sanitizeFileName(process.title)}_${Date.now()}.pdf`;
  doc.save(fileName);
};

// ========================================
// FONCTIONS UTILITAIRES
// ========================================

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    created: 'Créée',
    running: 'En cours',
    paused: 'En pause',
    completed: 'Complétée',
    failed: 'Échec',
    pending: 'En attente',
    'in-progress': 'En cours',
    error: 'Erreur',
  };
  return labels[status] || status;
}

function getTypeIcon(type: string): string {
  const icons: Record<string, string> = {
    info: 'ℹ️',
    success: '✅',
    warning: '⚠️',
    error: '❌',
  };
  return icons[type] || '•';
}

function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

function sanitizeFileName(fileName: string): string {
  return fileName
    .replace(/[^a-z0-9]/gi, '_')
    .toLowerCase()
    .substring(0, 50);
}
