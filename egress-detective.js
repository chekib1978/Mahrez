/**
 * EGRESS DETECTIVE - Identifie TOUS les coupables
 * À inclure temporairement pour diagnostic
 */

(function() {
  'use strict';

  const egressReport = {
    requests: [],
    totalBytes: 0,
    byTable: {},
    byMethod: {},
    byEndpoint: {},
    startTime: Date.now()
  };

  // Intercepter TOUTES les requêtes
  const originalFetch = window.fetch;
  
  window.fetch = async function(url, options = {}) {
    const startTime = Date.now();
    const method = options?.method || 'GET';
    
    try {
      const response = await originalFetch(url, options);
      
      // Analyser seulement Supabase
      if (url.includes('supabase.co')) {
        const cloned = response.clone();
        const data = await cloned.text();
        const size = new Blob([data]).size;
        const duration = Date.now() - startTime;
        
        // Extraire table
        const tableMatch = url.match(/rest\/v1\/([^?]+)/);
        const table = tableMatch ? tableMatch[1].split('?')[0] : 'unknown';
        
        // Extraire endpoint complet
        const endpoint = url.replace(/^https?:\/\/[^/]+/, '');
        
        // Enregistrer
        const record = {
          timestamp: new Date().toISOString(),
          url,
          endpoint,
          table,
          method,
          size,
          duration,
          status: response.status
        };
        
        egressReport.requests.push(record);
        egressReport.totalBytes += size;
        
        // Grouper par table
        if (!egressReport.byTable[table]) {
          egressReport.byTable[table] = { count: 0, bytes: 0, avgSize: 0 };
        }
        egressReport.byTable[table].count++;
        egressReport.byTable[table].bytes += size;
        egressReport.byTable[table].avgSize = egressReport.byTable[table].bytes / egressReport.byTable[table].count;
        
        // Grouper par méthode
        if (!egressReport.byMethod[method]) {
          egressReport.byMethod[method] = { count: 0, bytes: 0 };
        }
        egressReport.byMethod[method].count++;
        egressReport.byMethod[method].bytes += size;
        
        // Grouper par endpoint
        if (!egressReport.byEndpoint[endpoint]) {
          egressReport.byEndpoint[endpoint] = { count: 0, bytes: 0, table };
        }
        egressReport.byEndpoint[endpoint].count++;
        egressReport.byEndpoint[endpoint].bytes += size;
      }
      
      return response;
    } catch (error) {
      console.error('[DETECTIVE] Error:', error);
      throw error;
    }
  };

  // API Publique
  window.EGRESS_DETECTIVE = {
    // Rapport complet
    getReport() {
      const duration = (Date.now() - egressReport.startTime) / 1000;
      const totalMB = egressReport.totalBytes / 1024 / 1024;
      const requestsPerMin = (egressReport.requests.length / duration) * 60;
      const mbPerHour = (totalMB / duration) * 3600;
      const mbPerDay = mbPerHour * 24;
      
      return {
        summary: {
          duration: `${Math.round(duration)}s`,
          totalRequests: egressReport.requests.length,
          totalBytes: `${totalMB.toFixed(2)} MB`,
          requestsPerMin: Math.round(requestsPerMin),
          mbPerHour: `${mbPerHour.toFixed(2)} MB`,
          mbPerDay: `${mbPerDay.toFixed(2)} MB`,
          avgRequestSize: `${(egressReport.totalBytes / egressReport.requests.length / 1024).toFixed(2)} KB`
        },
        byTable: egressReport.byTable,
        byMethod: egressReport.byMethod,
        topEndpoints: Object.entries(egressReport.byEndpoint)
          .sort((a, b) => b[1].bytes - a[1].bytes)
          .slice(0, 10)
          .map(([endpoint, data]) => ({
            endpoint: endpoint.substring(0, 100),
            table: data.table,
            count: data.count,
            bytes: `${(data.bytes / 1024).toFixed(2)} KB`,
            avgSize: `${(data.bytes / data.count / 1024).toFixed(2)} KB`
          }))
      };
    },
    
    // Afficher rapport
    showReport() {
      const report = this.getReport();
      
      console.log('\n╔══════════════════════════════════════════════════╗');
      console.log('║          🔍 EGRESS DETECTIVE REPORT              ║');
      console.log('╚══════════════════════════════════════════════════╝\n');
      
      console.log('📊 RÉSUMÉ:');
      console.table(report.summary);
      
      console.log('\n📋 PAR TABLE:');
      const tableData = Object.entries(report.byTable)
        .sort((a, b) => b[1].bytes - a[1].bytes)
        .map(([table, data]) => ({
          table,
          requests: data.count,
          totalBytes: `${(data.bytes / 1024).toFixed(2)} KB`,
          avgSize: `${(data.avgSize / 1024).toFixed(2)} KB`,
          percent: `${((data.bytes / this.getReport().summary.totalBytes.replace(' MB', '') / 1024) * 100).toFixed(1)}%`
        }));
      console.table(tableData);
      
      console.log('\n🎯 TOP 10 ENDPOINTS:');
      console.table(report.topEndpoints);
      
      console.log('\n⚡ PAR MÉTHODE:');
      const methodData = Object.entries(report.byMethod).map(([method, data]) => ({
        method,
        requests: data.count,
        totalBytes: `${(data.bytes / 1024).toFixed(2)} KB`
      }));
      console.table(methodData);
      
      // Alertes
      console.log('\n⚠️  ALERTES:');
      this.getAlerts().forEach(alert => {
        console.log(`${alert.level} ${alert.message}`);
      });
      
      return report;
    },
    
    // Détecter anomalies
    getAlerts() {
      const alerts = [];
      const report = this.getReport();
      
      // Vérifier projection excessive
      Object.entries(egressReport.byEndpoint).forEach(([endpoint, data]) => {
        if (endpoint.includes('select=*') && data.bytes > 100000) {
          alerts.push({
            level: '🔴',
            type: 'SELECT_ALL',
            message: `SELECT * détecté sur ${data.table} (${(data.bytes/1024).toFixed(0)} KB) - Limiter colonnes !`,
            endpoint,
            recommendation: `Remplacer "select=*" par "select=col1,col2,col3"`
          });
        }
      });
      
      // Vérifier limit absent
      Object.entries(egressReport.byEndpoint).forEach(([endpoint, data]) => {
        if (!endpoint.includes('limit=') && data.count > 5) {
          alerts.push({
            level: '🟠',
            type: 'NO_LIMIT',
            message: `Pas de LIMIT sur ${data.table} (${data.count} requêtes) - Risque de tout charger !`,
            endpoint,
            recommendation: `Ajouter "?limit=100" ou pagination`
          });
        }
      });
      
      // Vérifier requêtes répétitives
      Object.entries(egressReport.byEndpoint).forEach(([endpoint, data]) => {
        if (data.count > 20) {
          alerts.push({
            level: '🟡',
            type: 'REPETITIVE',
            message: `${data.count} requêtes identiques sur ${data.table} - Candidat cache !`,
            endpoint,
            recommendation: `Augmenter TTL cache ou implémenter cache`
          });
        }
      });
      
      // Vérifier gros transferts
      Object.entries(report.byTable).forEach(([table, data]) => {
        if (data.avgSize > 50000) {
          alerts.push({
            level: '🔴',
            type: 'BIG_RESPONSE',
            message: `Réponse moyenne ${table}: ${(data.avgSize/1024).toFixed(0)} KB - Trop gros !`,
            recommendation: `Paginer, limiter colonnes, ou filtrer côté serveur`
          });
        }
      });
      
      // Vérifier charge totale
      const mbPerDay = parseFloat(report.summary.mbPerDay.replace(' MB', ''));
      if (mbPerDay > 1000) {
        alerts.push({
          level: '🔴',
          type: 'HIGH_EGRESS',
          message: `Projection: ${mbPerDay.toFixed(0)} MB/jour - TRÈS ÉLEVÉ !`,
          recommendation: `Implémenter cache + optimiser requêtes urgentes`
        });
      } else if (mbPerDay > 500) {
        alerts.push({
          level: '🟠',
          type: 'MEDIUM_EGRESS',
          message: `Projection: ${mbPerDay.toFixed(0)} MB/jour - Élevé`,
          recommendation: `Optimiser les requêtes les plus volumineuses`
        });
      }
      
      return alerts;
    },
    
    // Export JSON
    exportJSON() {
      const report = this.getReport();
      const json = JSON.stringify(report, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `egress-report-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    },
    
    // Export CSV
    exportCSV() {
      const rows = egressReport.requests.map(r => [
        r.timestamp,
        r.table,
        r.method,
        r.size,
        r.duration,
        r.status,
        r.endpoint
      ]);
      
      const header = ['Timestamp', 'Table', 'Method', 'Bytes', 'Duration (ms)', 'Status', 'Endpoint'];
      const csv = [header, ...rows].map(row => row.join(',')).join('\n');
      
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `egress-details-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    },
    
    // Reset
    reset() {
      egressReport.requests = [];
      egressReport.totalBytes = 0;
      egressReport.byTable = {};
      egressReport.byMethod = {};
      egressReport.byEndpoint = {};
      egressReport.startTime = Date.now();
      console.log('🔄 Détective réinitialisé');
    }
  };

  console.log('🔍 Egress Detective activé');
  console.log('📊 Utilisez EGRESS_DETECTIVE.showReport() après utilisation normale');

})();
