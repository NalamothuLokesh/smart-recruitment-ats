const db = require('../config/db');

class AnalyticsService {
  /**
   * Compute comprehensive recruitment analytics KPIs
   * Supports filtering by jobId, startDate, and endDate
   * Guarantees safe zero-division handling across all rates
   */
  async getSummary({ jobId, startDate, endDate }) {
    const params = [];
    const appConditions = ['a.withdrawn_at IS NULL'];

    if (jobId) {
      appConditions.push('a.job_id = ?');
      params.push(jobId);
    }

    if (startDate) {
      appConditions.push('a.applied_at >= ?');
      params.push(startDate);
    }

    if (endDate) {
      appConditions.push('a.applied_at <= ?');
      params.push(endDate);
    }

    const appWhere = appConditions.length > 0 ? `WHERE ${appConditions.join(' AND ')}` : '';

    // 1. Total Open Jobs KPI
    let openJobsSql = "SELECT COUNT(*) as open_jobs_count FROM jobs WHERE status = 'PUBLISHED'";
    const openJobsParams = [];
    if (jobId) {
      openJobsSql += ' AND id = ?';
      openJobsParams.push(jobId);
    }
    const [openJobsResult] = await db.query(openJobsSql, openJobsParams);
    const totalOpenJobs = openJobsResult[0].open_jobs_count;

    // 2. Application Volume KPI & Stage Distribution
    const [appVolumeResult] = await db.query(
      `SELECT COUNT(*) as total_applications,
              SUM(CASE WHEN current_stage = 'APPLIED' THEN 1 ELSE 0 END) as count_applied,
              SUM(CASE WHEN current_stage = 'SCREENING' THEN 1 ELSE 0 END) as count_screening,
              SUM(CASE WHEN current_stage = 'INTERVIEW' THEN 1 ELSE 0 END) as count_interview,
              SUM(CASE WHEN current_stage = 'SELECTED' THEN 1 ELSE 0 END) as count_selected,
              SUM(CASE WHEN current_stage = 'OFFERED' THEN 1 ELSE 0 END) as count_offered,
              SUM(CASE WHEN current_stage = 'REJECTED' THEN 1 ELSE 0 END) as count_rejected
       FROM applications a
       ${appWhere}`,
      params
    );

    const totalApplications = appVolumeResult[0].total_applications || 0;
    const stageBreakdown = {
      applied: parseInt(appVolumeResult[0].count_applied || 0, 10),
      screening: parseInt(appVolumeResult[0].count_screening || 0, 10),
      interview: parseInt(appVolumeResult[0].count_interview || 0, 10),
      selected: parseInt(appVolumeResult[0].count_selected || 0, 10),
      offered: parseInt(appVolumeResult[0].count_offered || 0, 10),
      rejected: parseInt(appVolumeResult[0].count_rejected || 0, 10)
    };

    // 3. Pipeline Funnel Progression Analysis (from audit logs)
    // Counts how many distinct applications ever entered each stage
    const [funnelResult] = await db.query(
      `SELECT 
         COUNT(DISTINCT a.id) as entered_applied,
         COUNT(DISTINCT CASE WHEN aal.to_stage IN ('SCREENING', 'INTERVIEW', 'SELECTED', 'OFFERED') OR a.current_stage IN ('SCREENING', 'INTERVIEW', 'SELECTED', 'OFFERED') THEN a.id END) as entered_screening,
         COUNT(DISTINCT CASE WHEN aal.to_stage IN ('INTERVIEW', 'SELECTED', 'OFFERED') OR a.current_stage IN ('INTERVIEW', 'SELECTED', 'OFFERED') THEN a.id END) as entered_interview,
         COUNT(DISTINCT CASE WHEN aal.to_stage IN ('SELECTED', 'OFFERED') OR a.current_stage IN ('SELECTED', 'OFFERED') THEN a.id END) as entered_selected,
         COUNT(DISTINCT CASE WHEN aal.to_stage = 'OFFERED' OR a.current_stage = 'OFFERED' THEN a.id END) as entered_offered
       FROM applications a
       LEFT JOIN application_audit_logs aal ON a.id = aal.application_id
       ${appWhere}`,
      params
    );

    const funnel = {
      applied: parseInt(funnelResult[0].entered_applied || 0, 10),
      screening: parseInt(funnelResult[0].entered_screening || 0, 10),
      interview: parseInt(funnelResult[0].entered_interview || 0, 10),
      selected: parseInt(funnelResult[0].entered_selected || 0, 10),
      offered: parseInt(funnelResult[0].entered_offered || 0, 10)
    };

    // Safe Stage-to-Stage Conversion Rates (documented denominators)
    const conversionRates = {
      appliedToScreening: funnel.applied > 0
        ? Number(((funnel.screening / funnel.applied) * 100).toFixed(1))
        : 0.0,
      screeningToInterview: funnel.screening > 0
        ? Number(((funnel.interview / funnel.screening) * 100).toFixed(1))
        : 0.0,
      interviewToSelected: funnel.interview > 0
        ? Number(((funnel.selected / funnel.interview) * 100).toFixed(1))
        : 0.0,
      selectedToOffered: funnel.selected > 0
        ? Number(((funnel.offered / funnel.selected) * 100).toFixed(1))
        : 0.0,
      overallFunnelEfficiency: funnel.applied > 0
        ? Number(((funnel.offered / funnel.applied) * 100).toFixed(1))
        : 0.0
    };

    // 4. Offer Analytics & Acceptance Rate
    const [offerStatsResult] = await db.query(
      `SELECT 
         COUNT(*) as total_offers,
         SUM(CASE WHEN o.status IN ('ISSUED', 'ACCEPTED', 'DECLINED') THEN 1 ELSE 0 END) as issued_offers,
         SUM(CASE WHEN o.status = 'ACCEPTED' THEN 1 ELSE 0 END) as accepted_offers,
         SUM(CASE WHEN o.status = 'DECLINED' THEN 1 ELSE 0 END) as declined_offers,
         AVG(CASE WHEN o.status = 'ACCEPTED' AND o.responded_at IS NOT NULL
                  THEN TIMESTAMPDIFF(SECOND, a.applied_at, o.responded_at) / 86400.0
                  ELSE NULL END) as avg_time_to_hire_days
       FROM offers o
       JOIN applications a ON o.application_id = a.id
       ${appWhere}`,
      params
    );

    const totalIssuedOffers = parseInt(offerStatsResult[0].issued_offers || 0, 10);
    const acceptedOffers = parseInt(offerStatsResult[0].accepted_offers || 0, 10);
    const declinedOffers = parseInt(offerStatsResult[0].declined_offers || 0, 10);

    const offerAcceptanceRate = totalIssuedOffers > 0
      ? Number(((acceptedOffers / totalIssuedOffers) * 100).toFixed(1))
      : 0.0;

    const avgTimeToHireDays = offerStatsResult[0].avg_time_to_hire_days !== null
      ? Number(parseFloat(offerStatsResult[0].avg_time_to_hire_days).toFixed(1))
      : 0.0;

    // 5. Notification System Delivery Rate
    const [notifResult] = await db.query(
      `SELECT 
         COUNT(*) as total_notifications,
         SUM(CASE WHEN delivery_status IN ('SENT', 'SIMULATED') THEN 1 ELSE 0 END) as successful_notifications,
         SUM(CASE WHEN delivery_status = 'FAILED' THEN 1 ELSE 0 END) as failed_notifications
       FROM notification_logs`
    );

    const totalNotifs = parseInt(notifResult[0].total_notifications || 0, 10);
    const successfulNotifs = parseInt(notifResult[0].successful_notifications || 0, 10);
    const notificationDeliveryRate = totalNotifs > 0
      ? Number(((successfulNotifs / totalNotifs) * 100).toFixed(1))
      : 100.0; // Safe default for uninitialized systems

    return {
      filters: {
        jobId: jobId ? parseInt(jobId, 10) : null,
        startDate: startDate || null,
        endDate: endDate || null
      },
      kpis: {
        totalOpenJobs,
        applicationVolume: totalApplications,
        averageTimeToHireDays: avgTimeToHireDays,
        offerAcceptanceRate,
        notificationDeliveryRate
      },
      funnel: {
        counts: funnel,
        conversionRates
      },
      stageBreakdown,
      offers: {
        total: parseInt(offerStatsResult[0].total_offers || 0, 10),
        issued: totalIssuedOffers,
        accepted: acceptedOffers,
        declined: declinedOffers,
        acceptanceRate: offerAcceptanceRate
      },
      notifications: {
        total: totalNotifs,
        successful: successfulNotifs,
        failed: parseInt(notifResult[0].failed_notifications || 0, 10),
        deliveryRate: notificationDeliveryRate
      }
    };
  }
}

module.exports = new AnalyticsService();

