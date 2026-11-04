import {
  AlertTriangle,
  Building2,
  ChevronDown,
  ChevronUp,
  Clock,
  Edit,
  LayoutGrid,
  Phone,
  Plus,
  Search,
  Table as TableIcon,
  Zap,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import AdminNavbar from '../../components/admin/navbar'
import Pagination from '../../common/pagination'
import AdminSidebar from '../../components/admin/sidebar'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import {
  SidebarInset,
  SidebarProvider,
} from '../../components/ui/sidebar'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog'

// Official 31 Barangays of Valencia City, Bukidnon
const initialBarangays = [
  {
    code: 'VAL-001',
    name: 'Poblacion',
    zone: 'Central Urban',
    status: 'Energized',
    activeReports: 0,
    affectedHouseholds: 0,
    totalHouseholds: 8420,
    assignedCrew: 'Standby Unit 1',
    restorationEta: 'Normal Grid Service',
    captain: 'Hon. Eduardo Galacio',
    contactNumber: '+63 917 123 4567',
    lastUpdated: '10 mins ago',
  },
  {
    code: 'VAL-002',
    name: 'Bagontapay',
    zone: 'East District',
    status: 'Interrupted',
    activeReports: 6,
    affectedHouseholds: 1250,
    totalHouseholds: 3100,
    assignedCrew: 'Rapid Response Bravo',
    restorationEta: 'Today, 4:30 PM',
    captain: 'Hon. Manuel Tan',
    contactNumber: '+63 917 234 5678',
    lastUpdated: '5 mins ago',
  },
  {
    code: 'VAL-003',
    name: 'Batangan',
    zone: 'South District',
    status: 'Energized',
    activeReports: 0,
    affectedHouseholds: 0,
    totalHouseholds: 2850,
    assignedCrew: 'Standby Unit 2',
    restorationEta: 'Normal Grid Service',
    captain: 'Hon. Roberto Chavez',
    contactNumber: '+63 917 345 6789',
    lastUpdated: '25 mins ago',
  },
  {
    code: 'VAL-004',
    name: 'Catumbalon',
    zone: 'North District',
    status: 'Energized',
    activeReports: 1,
    affectedHouseholds: 0,
    totalHouseholds: 2100,
    assignedCrew: 'Standby Unit 3',
    restorationEta: 'Normal Grid Service',
    captain: 'Hon. Maria Liza Roxas',
    contactNumber: '+63 917 456 7890',
    lastUpdated: '1 hour ago',
  },
  {
    code: 'VAL-005',
    name: 'Colonia',
    zone: 'West District',
    status: 'Partial Outage',
    activeReports: 4,
    affectedHouseholds: 620,
    totalHouseholds: 1950,
    assignedCrew: 'Line Crew Delta',
    restorationEta: 'Today, 6:00 PM',
    captain: 'Hon. Danilo Santos',
    contactNumber: '+63 917 567 8901',
    lastUpdated: '12 mins ago',
  },
  {
    code: 'VAL-006',
    name: 'Concepcion',
    zone: 'East District',
    status: 'Energized',
    activeReports: 0,
    affectedHouseholds: 0,
    totalHouseholds: 1800,
    assignedCrew: 'Standby Unit 1',
    restorationEta: 'Normal Grid Service',
    captain: 'Hon. Antonio Flores',
    contactNumber: '+63 917 678 9012',
    lastUpdated: '40 mins ago',
  },
  {
    code: 'VAL-007',
    name: 'Dagat-Kidavao',
    zone: 'North District',
    status: 'Energized',
    activeReports: 0,
    affectedHouseholds: 0,
    totalHouseholds: 1650,
    assignedCrew: 'Standby Unit 3',
    restorationEta: 'Normal Grid Service',
    captain: 'Hon. Josefina Lim',
    contactNumber: '+63 917 789 0123',
    lastUpdated: '2 hours ago',
  },
  {
    code: 'VAL-008',
    name: 'Guinoyuran',
    zone: 'West District',
    status: 'Maintenance',
    activeReports: 2,
    affectedHouseholds: 1400,
    totalHouseholds: 2900,
    assignedCrew: 'Substation Maintenance Team',
    restorationEta: 'Today, 5:00 PM (Scheduled)',
    captain: 'Hon. Ricardo Mercado',
    contactNumber: '+63 917 890 1234',
    lastUpdated: '15 mins ago',
  },
  {
    code: 'VAL-009',
    name: 'Laligan',
    zone: 'East District',
    status: 'Energized',
    activeReports: 0,
    affectedHouseholds: 0,
    totalHouseholds: 2200,
    assignedCrew: 'Standby Unit 2',
    restorationEta: 'Normal Grid Service',
    captain: 'Hon. Grace Villanueva',
    contactNumber: '+63 917 901 2345',
    lastUpdated: '35 mins ago',
  },
  {
    code: 'VAL-010',
    name: 'Lilingayon',
    zone: 'South District',
    status: 'Energized',
    activeReports: 0,
    affectedHouseholds: 0,
    totalHouseholds: 2450,
    assignedCrew: 'Standby Unit 1',
    restorationEta: 'Normal Grid Service',
    captain: 'Hon. Fernando Ocampo',
    contactNumber: '+63 917 012 3456',
    lastUpdated: '50 mins ago',
  },
  {
    code: 'VAL-011',
    name: 'Lourdes',
    zone: 'Central Urban',
    status: 'Interrupted',
    activeReports: 5,
    affectedHouseholds: 980,
    totalHouseholds: 3600,
    assignedCrew: 'Emergency Feeder Team Alpha',
    restorationEta: 'Today, 4:00 PM',
    captain: 'Hon. Alicia Soriano',
    contactNumber: '+63 917 111 2233',
    lastUpdated: '3 mins ago',
  },
  {
    code: 'VAL-012',
    name: 'Lumbayao',
    zone: 'East District',
    status: 'Energized',
    activeReports: 0,
    affectedHouseholds: 0,
    totalHouseholds: 3100,
    assignedCrew: 'Standby Unit 3',
    restorationEta: 'Normal Grid Service',
    captain: 'Hon. Vicente Navarro',
    contactNumber: '+63 917 222 3344',
    lastUpdated: '1 hour ago',
  },
  {
    code: 'VAL-013',
    name: 'Mailag',
    zone: 'North District',
    status: 'Energized',
    activeReports: 0,
    affectedHouseholds: 0,
    totalHouseholds: 2750,
    assignedCrew: 'Standby Unit 2',
    restorationEta: 'Normal Grid Service',
    captain: 'Hon. Ramon Bautista',
    contactNumber: '+63 917 333 4455',
    lastUpdated: '18 mins ago',
  },
  {
    code: 'VAL-014',
    name: 'San Carlos',
    zone: 'West District',
    status: 'Energized',
    activeReports: 0,
    affectedHouseholds: 0,
    totalHouseholds: 2300,
    assignedCrew: 'Standby Unit 1',
    restorationEta: 'Normal Grid Service',
    captain: 'Hon. Teresa Domingo',
    contactNumber: '+63 917 444 5566',
    lastUpdated: '22 mins ago',
  },
  {
    code: 'VAL-015',
    name: 'Sugod',
    zone: 'Central Urban',
    status: 'Energized',
    activeReports: 0,
    affectedHouseholds: 0,
    totalHouseholds: 3200,
    assignedCrew: 'Standby Unit 2',
    restorationEta: 'Normal Grid Service',
    captain: 'Hon. Gabriel Castro',
    contactNumber: '+63 917 555 6677',
    lastUpdated: '45 mins ago',
  },
  {
    code: 'VAL-016',
    name: 'Tongantongan',
    zone: 'Central Urban',
    status: 'Energized',
    activeReports: 1,
    affectedHouseholds: 0,
    totalHouseholds: 2950,
    assignedCrew: 'Standby Unit 3',
    restorationEta: 'Normal Grid Service',
    captain: 'Hon. Carmelita Perez',
    contactNumber: '+63 917 666 7788',
    lastUpdated: '10 mins ago',
  },
  {
    code: 'VAL-017',
    name: 'Bantuanon',
    zone: 'South District',
    status: 'Energized',
    activeReports: 0,
    affectedHouseholds: 0,
    totalHouseholds: 1500,
    assignedCrew: 'Standby Unit 1',
    restorationEta: 'Normal Grid Service',
    captain: 'Hon. Sergio Cruz',
    contactNumber: '+63 917 777 8899',
    lastUpdated: '1 hour ago',
  },
  {
    code: 'VAL-018',
    name: 'Barobo',
    zone: 'West District',
    status: 'Energized',
    activeReports: 0,
    affectedHouseholds: 0,
    totalHouseholds: 1400,
    assignedCrew: 'Standby Unit 2',
    restorationEta: 'Normal Grid Service',
    captain: 'Hon. Patricia Ramos',
    contactNumber: '+63 917 888 9900',
    lastUpdated: '1 hour ago',
  },
  {
    code: 'VAL-019',
    name: 'Datu Salumay',
    zone: 'North District',
    status: 'Energized',
    activeReports: 0,
    affectedHouseholds: 0,
    totalHouseholds: 1200,
    assignedCrew: 'Standby Unit 3',
    restorationEta: 'Normal Grid Service',
    captain: 'Hon. Mario Alcantara',
    contactNumber: '+63 917 999 0011',
    lastUpdated: '3 hours ago',
  },
  {
    code: 'VAL-020',
    name: 'Kahaponan',
    zone: 'North District',
    status: 'Energized',
    activeReports: 0,
    affectedHouseholds: 0,
    totalHouseholds: 2400,
    assignedCrew: 'Standby Unit 1',
    restorationEta: 'Normal Grid Service',
    captain: 'Hon. Lucita Gonzales',
    contactNumber: '+63 917 000 1122',
    lastUpdated: '2 hours ago',
  },
]

function GridStatusBadge({ status }) {
  const styles = {
    Energized: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    Interrupted: 'border-red-200 bg-red-50 text-red-700 animate-pulse',
    'Partial Outage': 'border-amber-200 bg-amber-50 text-amber-700',
    Maintenance: 'border-blue-200 bg-blue-50 text-blue-700',
  }
  const dotColors = {
    Energized: 'bg-emerald-500',
    Interrupted: 'bg-red-500',
    'Partial Outage': 'bg-amber-500',
    Maintenance: 'bg-blue-500',
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
        styles[status] || styles.Energized
      }`}
    >
      <span className={`size-1.5 rounded-full ${dotColors[status] || dotColors.Energized}`} />
      {status}
    </span>
  )
}

function AdminBarangay() {
  const [barangays, setBarangays] = useState(initialBarangays)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [zoneFilter, setZoneFilter] = useState('All Zones')
  const [viewMode, setViewMode] = useState('table') // 'table' or 'grid'
  const [sortField, setSortField] = useState('name')
  const [sortOrder, setSortOrder] = useState('asc')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Status edit modal state
  const [selectedBarangay, setSelectedBarangay] = useState(null)
  const [isUpdateOpen, setIsUpdateOpen] = useState(false)
  const [statusForm, setStatusForm] = useState({
    status: 'Energized',
    restorationEta: '',
    affectedHouseholds: 0,
    assignedCrew: '',
  })

  // Create barangay modal state
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [newBarangay, setNewBarangay] = useState({
    name: '',
    zone: 'Central Urban',
    captain: '',
    contactNumber: '',
    totalHouseholds: 2000,
  })

  // Sorting
  function toggleSort(field) {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortOrder('asc')
    }
  }

  // Filtered & sorted barangays
  const filteredBarangays = useMemo(() => {
    let list = barangays.filter((b) => {
      const q = query.toLowerCase()
      const matchesQuery =
        b.name.toLowerCase().includes(q) ||
        b.captain.toLowerCase().includes(q) ||
        b.code.toLowerCase().includes(q) ||
        b.zone.toLowerCase().includes(q)
      const matchesStatus = statusFilter === 'All' || b.status === statusFilter
      const matchesZone = zoneFilter === 'All Zones' || b.zone === zoneFilter
      return matchesQuery && matchesStatus && matchesZone
    })

    list.sort((a, b) => {
      if (sortField === 'name') {
        return sortOrder === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)
      }
      if (sortField === 'activeReports') {
        return sortOrder === 'asc' ? a.activeReports - b.activeReports : b.activeReports - a.activeReports
      }
      if (sortField === 'status') {
        return sortOrder === 'asc' ? a.status.localeCompare(b.status) : b.status.localeCompare(a.status)
      }
      return 0
    })

    return list
  }, [barangays, query, statusFilter, zoneFilter, sortField, sortOrder])

  // Pagination slice
  const visibleBarangays = useMemo(() => {
    const start = (page - 1) * pageSize
    return filteredBarangays.slice(start, start + pageSize)
  }, [filteredBarangays, page, pageSize])

  // Open update modal
  function handleOpenUpdate(barangay) {
    setSelectedBarangay(barangay)
    setStatusForm({
      status: barangay.status,
      restorationEta: barangay.restorationEta,
      affectedHouseholds: barangay.affectedHouseholds,
      assignedCrew: barangay.assignedCrew,
    })
    setIsUpdateOpen(true)
  }

  // Submit status update
  function handleSaveStatus(e) {
    e.preventDefault()
    if (!selectedBarangay) return
    setBarangays((prev) =>
      prev.map((b) =>
        b.code === selectedBarangay.code
          ? {
              ...b,
              status: statusForm.status,
              restorationEta:
                statusForm.status === 'Energized' ? 'Normal Grid Service' : statusForm.restorationEta,
              affectedHouseholds:
                statusForm.status === 'Energized' ? 0 : Number(statusForm.affectedHouseholds),
              assignedCrew: statusForm.assignedCrew || b.assignedCrew,
              lastUpdated: 'Just now',
            }
          : b
      )
    )
    setIsUpdateOpen(false)
  }

  // Add new barangay
  function handleCreateBarangay(e) {
    e.preventDefault()
    if (!newBarangay.name.trim()) return
    const created = {
      code: `VAL-0${barangays.length + 1}`,
      name: newBarangay.name.trim(),
      zone: newBarangay.zone,
      status: 'Energized',
      activeReports: 0,
      affectedHouseholds: 0,
      totalHouseholds: Number(newBarangay.totalHouseholds) || 2000,
      assignedCrew: 'Standby Unit',
      restorationEta: 'Normal Grid Service',
      captain: newBarangay.captain || 'Barangay Council',
      contactNumber: newBarangay.contactNumber || '+63 917 000 0000',
      lastUpdated: 'Just now',
    }
    setBarangays([created, ...barangays])
    setIsCreateOpen(false)
    setNewBarangay({
      name: '',
      zone: 'Central Urban',
      captain: '',
      contactNumber: '',
      totalHouseholds: 2000,
    })
  }

  return (
    <SidebarProvider>
      <AdminSidebar activePath="/admin/barangay" />
      <SidebarInset className="bg-[#f8fafc] min-h-screen">
        <AdminNavbar title="Dashboard" section="Barangays" />
        <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-[1400px] space-y-6">
            {/* Header: Title + Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                  <Building2 className="size-6 text-brand-blue" />
                  Barangays
                </h1>
                <p className="mt-1 text-xs sm:text-sm text-slate-500">
                  Valencia City power grid status, outage reports, and response crew assignments across all 31 barangays.
                </p>
              </div>

              <div className="flex items-center gap-2.5">
                <Button
                  onClick={() => setIsCreateOpen(true)}
                  className="h-10 gap-2 bg-brand-blue hover:bg-brand-navy px-4 font-semibold text-white shadow-xs rounded-lg transition-colors cursor-pointer"
                >
                  <Plus className="size-4" />
                  <span>Add Barangay</span>
                </Button>
              </div>
            </div>

            {/* Main Table Card */}
            <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
              {/* Filter Toolbar */}
              <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100">
                {/* Search Bar */}
                <div className="relative w-full sm:max-w-xs">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    className="h-10 rounded-lg border-slate-200 bg-white pl-9 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:border-brand-blue focus:ring-1 focus:ring-brand-blue"
                    placeholder="Search barangay, captain, code..."
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value)
                      setPage(1)
                    }}
                    aria-label="Search barangays"
                  />
                </div>

                {/* Filter Pills, Zone Select & View Toggle */}
                <div className="flex flex-wrap items-center gap-2">
                  {/* Status Pills */}
                  <div className="flex items-center gap-1 rounded-xl bg-slate-100/80 p-1">
                    {['All', 'Energized', 'Interrupted', 'Partial Outage', 'Maintenance'].map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => {
                          setStatusFilter(st)
                          setPage(1)
                        }}
                        className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer ${
                          statusFilter === st
                            ? 'bg-white text-slate-900 shadow-xs'
                            : 'text-slate-500 hover:text-slate-900'
                        }`}
                      >
                        {st !== 'All' && (
                          <span
                            className={`size-1.5 rounded-full ${
                              st === 'Energized'
                                ? 'bg-emerald-500'
                                : st === 'Interrupted'
                                ? 'bg-red-500'
                                : st === 'Partial Outage'
                                ? 'bg-amber-500'
                                : 'bg-blue-500'
                            }`}
                          />
                        )}
                        {st}
                      </button>
                    ))}
                  </div>

                  {/* Zone Selector */}
                  <select
                    value={zoneFilter}
                    onChange={(e) => {
                      setZoneFilter(e.target.value)
                      setPage(1)
                    }}
                    className="h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 shadow-xs focus:outline-none focus:ring-1 focus:ring-brand-blue cursor-pointer"
                  >
                    <option>All Zones</option>
                    <option>Central Urban</option>
                    <option>North District</option>
                    <option>South District</option>
                    <option>East District</option>
                    <option>West District</option>
                  </select>

                  {/* View Mode Toggle: Table or Grid */}
                  <div className="flex items-center rounded-lg border border-slate-200 p-0.5">
                    <button
                      type="button"
                      onClick={() => setViewMode('table')}
                      className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                        viewMode === 'table' ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:text-slate-600'
                      }`}
                      aria-label="Table view"
                    >
                      <TableIcon className="size-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode('grid')}
                      className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                        viewMode === 'grid' ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:text-slate-600'
                      }`}
                      aria-label="Grid view"
                    >
                      <LayoutGrid className="size-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* View 1: Data Table View */}
              {viewMode === 'table' ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-slate-50/60">
                      <TableRow className="border-b border-slate-100 hover:bg-transparent">
                        <TableHead
                          onClick={() => toggleSort('name')}
                          className="h-11 px-5 text-[11px] font-bold uppercase tracking-wider text-slate-500 cursor-pointer select-none hover:text-slate-800"
                        >
                          <div className="flex items-center gap-1">
                            <span>BARANGAY</span>
                            {sortField === 'name' ? (
                              sortOrder === 'asc' ? (
                                <ChevronUp className="size-3.5 text-brand-blue" />
                              ) : (
                                <ChevronDown className="size-3.5 text-brand-blue" />
                              )
                            ) : (
                              <ChevronUp className="size-3.5 opacity-30" />
                            )}
                          </div>
                        </TableHead>

                        <TableHead
                          onClick={() => toggleSort('status')}
                          className="h-11 px-5 text-[11px] font-bold uppercase tracking-wider text-slate-500 cursor-pointer select-none hover:text-slate-800"
                        >
                          <div className="flex items-center gap-1">
                            <span>POWER STATUS</span>
                            {sortField === 'status' && (
                              sortOrder === 'asc' ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />
                            )}
                          </div>
                        </TableHead>

                        <TableHead
                          onClick={() => toggleSort('activeReports')}
                          className="h-11 px-5 text-[11px] font-bold uppercase tracking-wider text-slate-500 cursor-pointer select-none hover:text-slate-800"
                        >
                          <div className="flex items-center gap-1">
                            <span>ACTIVE REPORTS</span>
                            {sortField === 'activeReports' && (
                              sortOrder === 'asc' ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />
                            )}
                          </div>
                        </TableHead>

                        <TableHead className="h-11 px-5 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                          RESPONSE CREW
                        </TableHead>

                        <TableHead className="h-11 px-5 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                          EST. RESTORATION
                        </TableHead>

                        <TableHead className="h-11 px-5 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                          LIAISON / CAPTAIN
                        </TableHead>

                        <TableHead className="h-11 px-5 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                          CONTACT
                        </TableHead>

                        <TableHead className="h-11 w-10 px-3 text-right"></TableHead>
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      {visibleBarangays.map((b) => (
                        <TableRow key={b.code} className="border-b border-slate-100 hover:bg-slate-50/60 transition-colors">
                          {/* Barangay Name & Code */}
                          <TableCell className="px-5 py-4">
                            <div>
                              <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                {b.name}
                                <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">
                                  {b.code}
                                </span>
                              </div>
                              <span className="text-xs text-slate-400 font-medium">{b.zone}</span>
                            </div>
                          </TableCell>

                          {/* Status Pill Badge */}
                          <TableCell className="px-5 py-4">
                            <GridStatusBadge status={b.status} />
                          </TableCell>

                          {/* Active Citizen Reports */}
                          <TableCell className="px-5 py-4">
                            {b.activeReports > 0 ? (
                              <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 border border-amber-200 px-2 py-0.5 text-xs font-bold text-amber-700">
                                <AlertTriangle className="size-3" />
                                {b.activeReports} reports
                              </span>
                            ) : (
                              <span className="text-xs text-slate-400 font-medium">0 reports</span>
                            )}
                          </TableCell>

                          {/* Assigned Crew */}
                          <TableCell className="px-5 py-4 text-xs font-medium text-slate-700">
                            {b.assignedCrew}
                          </TableCell>

                          {/* Estimated Restoration */}
                          <TableCell className="px-5 py-4 text-xs text-slate-600">
                            <div className="flex items-center gap-1.5">
                              {b.status === 'Energized' ? (
                                <Zap className="size-3.5 text-emerald-500" />
                              ) : (
                                <Clock className="size-3.5 text-amber-500" />
                              )}
                              <span>{b.restorationEta}</span>
                            </div>
                          </TableCell>

                          {/* Captain / Contact Person */}
                          <TableCell className="px-5 py-4 text-xs font-semibold text-slate-800">
                            {b.captain}
                          </TableCell>

                          {/* Phone Hotline */}
                          <TableCell className="px-5 py-4 text-xs text-slate-500 whitespace-nowrap">
                            <div className="flex items-center gap-1">
                              <Phone className="size-3 text-slate-400" />
                              <span>{b.contactNumber}</span>
                            </div>
                          </TableCell>

                          {/* Action Button */}
                          <TableCell className="px-3 py-4 text-right">
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => handleOpenUpdate(b)}
                              className="h-8 w-8 text-slate-400 hover:text-brand-blue hover:bg-blue-50 rounded-md cursor-pointer"
                              title="Update grid status"
                            >
                              <Edit className="size-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}

                      {visibleBarangays.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={8} className="h-36 text-center text-sm text-slate-400">
                            No barangays found matching your search and filter criteria.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                /* View 2: Visual Grid Cards */
                <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {visibleBarangays.map((b) => (
                    <div
                      key={b.code}
                      className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs hover:border-brand-blue transition-all"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-bold text-slate-900 text-base">{b.name}</div>
                          <div className="text-xs text-slate-400 font-medium">{b.zone} • {b.code}</div>
                        </div>
                        <GridStatusBadge status={b.status} />
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-2 text-xs border-y border-slate-100 py-3">
                        <div>
                          <span className="text-slate-400 text-[10px] uppercase font-bold">Reports</span>
                          <div className="font-semibold text-slate-700">
                            {b.activeReports > 0 ? `${b.activeReports} active` : 'None'}
                          </div>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[10px] uppercase font-bold">Households</span>
                          <div className="font-semibold text-slate-700">{b.totalHouseholds.toLocaleString()} HH</div>
                        </div>
                        <div className="col-span-2">
                          <span className="text-slate-400 text-[10px] uppercase font-bold">Restoration ETA</span>
                          <div className="font-medium text-slate-800 flex items-center gap-1 mt-0.5">
                            <Clock className="size-3 text-slate-400" />
                            {b.restorationEta}
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                        <div className="truncate pr-2">
                          <span className="font-medium text-slate-700 block truncate">{b.captain}</span>
                          <span className="text-[11px] text-slate-400">{b.contactNumber}</span>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenUpdate(b)}
                          className="h-8 text-xs font-semibold gap-1 text-brand-blue hover:bg-blue-50 cursor-pointer"
                        >
                          <Edit className="size-3.5" />
                          <span>Update</span>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Common Reusable Pagination */}
              <Pagination
                page={page}
                pageSize={pageSize}
                total={filteredBarangays.length}
                onPageChange={setPage}
                onPageSizeChange={(newSize) => {
                  setPageSize(newSize)
                  setPage(1)
                }}
                pageSizeOptions={[5, 10, 20, 50]}
              />
            </section>
          </div>
        </main>
      </SidebarInset>

      {/* Modal: Update Grid Status */}
      <Dialog open={isUpdateOpen} onOpenChange={setIsUpdateOpen}>
        <DialogContent className="sm:max-w-[440px] rounded-2xl bg-white p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Zap className="size-5 text-brand-blue" />
              Update Barangay Power Status
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Update real-time grid status and restoration ETA for {selectedBarangay?.name}.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveStatus} className="space-y-4 py-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500">Power Grid Status</label>
              <select
                value={statusForm.status}
                onChange={(e) => setStatusForm({ ...statusForm, status: e.target.value })}
                className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 shadow-xs focus:ring-1 focus:ring-brand-blue"
              >
                <option value="Energized">Energized (Normal Service)</option>
                <option value="Interrupted">Interrupted (Full Outage)</option>
                <option value="Partial Outage">Partial Outage (Feeder Issue)</option>
                <option value="Maintenance">Maintenance (Scheduled Work)</option>
              </select>
            </div>

            {statusForm.status !== 'Energized' && (
              <>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500">Estimated Restoration Time</label>
                  <Input
                    placeholder="e.g. Today, 5:30 PM"
                    value={statusForm.restorationEta}
                    onChange={(e) => setStatusForm({ ...statusForm, restorationEta: e.target.value })}
                    className="h-10 text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500">Affected Households</label>
                  <Input
                    type="number"
                    placeholder="e.g. 1200"
                    value={statusForm.affectedHouseholds}
                    onChange={(e) => setStatusForm({ ...statusForm, affectedHouseholds: e.target.value })}
                    className="h-10 text-sm"
                  />
                </div>
              </>
            )}

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500">Assigned Response Crew</label>
              <Input
                placeholder="e.g. Rapid Response Bravo"
                value={statusForm.assignedCrew}
                onChange={(e) => setStatusForm({ ...statusForm, assignedCrew: e.target.value })}
                className="h-10 text-sm"
              />
            </div>

            <DialogFooter className="pt-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsUpdateOpen(false)}
                className="rounded-lg text-xs font-semibold"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-brand-blue hover:bg-brand-navy text-white rounded-lg text-xs font-semibold"
              >
                Save Updates
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal: Add Barangay */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[440px] rounded-2xl bg-white p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="size-5 text-brand-blue" />
              Register Barangay Liaison
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Register a barangay contact and liaison for power outage response coordination.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateBarangay} className="space-y-4 py-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500">Barangay Name</label>
              <Input
                required
                placeholder="e.g. Sinayawan"
                value={newBarangay.name}
                onChange={(e) => setNewBarangay({ ...newBarangay, name: e.target.value })}
                className="h-10 text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500">Zone / District</label>
              <select
                value={newBarangay.zone}
                onChange={(e) => setNewBarangay({ ...newBarangay, zone: e.target.value })}
                className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 shadow-xs focus:ring-1 focus:ring-brand-blue"
              >
                <option>Central Urban</option>
                <option>North District</option>
                <option>South District</option>
                <option>East District</option>
                <option>West District</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500">Barangay Captain / Liaison</label>
              <Input
                placeholder="e.g. Hon. Juan Dela Cruz"
                value={newBarangay.captain}
                onChange={(e) => setNewBarangay({ ...newBarangay, captain: e.target.value })}
                className="h-10 text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500">Contact Hotline</label>
                <Input
                  placeholder="+63 917 000 0000"
                  value={newBarangay.contactNumber}
                  onChange={(e) => setNewBarangay({ ...newBarangay, contactNumber: e.target.value })}
                  className="h-10 text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500">Total Households</label>
                <Input
                  type="number"
                  placeholder="2500"
                  value={newBarangay.totalHouseholds}
                  onChange={(e) => setNewBarangay({ ...newBarangay, totalHouseholds: e.target.value })}
                  className="h-10 text-sm"
                />
              </div>
            </div>

            <DialogFooter className="pt-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateOpen(false)}
                className="rounded-lg text-xs font-semibold"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-brand-blue hover:bg-brand-navy text-white rounded-lg text-xs font-semibold"
              >
                Register Barangay
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  )
}

export default AdminBarangay
