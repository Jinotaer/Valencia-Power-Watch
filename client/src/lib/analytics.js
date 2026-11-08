import { loadAllReports, loadStaff } from './reports'
import { loadAllAdminUsers } from './adminUsers'
import { loadBarangays } from './barangays'
import { loadSchedules } from './schedules'
import { loadAnnouncements } from './announcements'

function countBy(rows, key) {
  const counts = {}
  rows.forEach((row) => {
    const value = typeof key === 'function' ? key(row) : row[key]
    if (value) counts[value] = (counts[value] ?? 0) + 1
  })
  return counts
}

// Admin overview aggregates: live totals and distributions.
export async function loadAnalyticsOverview() {
  const [reports, allUsers, staff, barangays, schedules, announcements] = await Promise.all([
    loadAllReports().catch(() => []),
    loadAllAdminUsers().catch(() => []),
    loadStaff().catch(() => []),
    loadBarangays().catch(() => []),
    loadSchedules().catch(() => []),
    loadAnnouncements(100).catch(() => []),
  ])

  const byStatus = countBy(reports, (report) => report.tone)
  const byType = countBy(reports, (report) => report.outageType)
  const byBarangay = countBy(reports, (report) => report.barangay)
  const byStaff = countBy(reports, (report) => report.assignedStaffId)

  const todayKey = new Date().toISOString().slice(0, 10)
  const reportsToday = reports.filter((report) => (report.createdAt || '').slice(0, 10) === todayKey).length

  const activeIncidents = reports.filter((report) =>
    ['pending', 'verified'].includes(report.tone),
  ).length

  const recent = [
    ...reports.slice(0, 20).map((report) => ({
      type: 'Report',
      title: `${report.id} — ${report.outageType}`,
      detail: `${report.location} · ${report.status}`,
      when: report.updatedAt ?? report.createdAt,
    })),
    ...schedules.slice(0, 20).map((schedule) => ({
      type: 'Schedule',
      title: schedule.title,
      detail: `${schedule.barangay ? `Brgy. ${schedule.barangay} · ` : ''}${schedule.dateLabel} · ${schedule.timeLabel}`,
      when: schedule.date,
    })),
    ...announcements.slice(0, 20).map((announcement) => ({
      type: 'Announcement',
      title: announcement.title,
      detail: announcement.barangay ? `Brgy. ${announcement.barangay} · ${announcement.category}` : announcement.category,
      when: announcement.publishedAt,
    })),
  ]
    .filter((item) => item.when)
    .sort((a, b) => new Date(b.when) - new Date(a.when))
    .slice(0, 30)

  return {
    totalUsers: allUsers.length,
    residentUsers: allUsers.filter((user) => user.role.toLowerCase() === 'resident').length,
    staffUsers: staff.length || allUsers.filter((user) => user.role.toLowerCase() === 'staff').length,
    adminUsers: allUsers.filter((user) => user.role.toLowerCase() === 'admin').length,
    reports: reports.length,
    reportsToday,
    pendingReports: byStatus.pending ?? 0,
    verifiedReports: byStatus.verified ?? 0,
    resolvedReports: byStatus.resolved ?? 0,
    rejectedReports: byStatus.rejected ?? 0,
    activeIncidents,
    barangays: barangays.length,
    publishedSchedules: schedules.filter((schedule) => schedule.status === 'published').length,
    announcements: announcements.length,
    byStatus,
    byType,
    byBarangay,
    byStaff,
    recent,
  }
}
