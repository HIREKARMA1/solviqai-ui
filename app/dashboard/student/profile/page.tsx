"use client"

import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import Link from 'next/link'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Loader } from '@/components/ui/loader'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { apiClient } from '@/lib/api'
import {
  ChipInput,
  ConfirmDeleteDialog,
  InventoryItem,
  InventorySection,
  SkillsInventory,
} from '@/components/dashboard/profile/ProfileInventory'
import {
  SECTION_LABELS,
  profileMediaUrl,
  strengthBarClass,
  strengthTone,
  type CareerPreferences,
  type StudentCertification,
  type StudentExperience,
  type StudentProject,
  type StudentSkill,
} from '@/lib/studentProfile'
import {
  Award,
  Briefcase,
  Camera,
  FolderKanban,
  GraduationCap,
  Save,
  Sparkles,
  Target,
  User,
} from 'lucide-react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'

const inputClass =
  'border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 transition-colors'

const emptySkill = (): Partial<StudentSkill> => ({
  name: '',
  category: 'technical',
  source: 'manual',
})
const emptyProject = (): Partial<StudentProject> => ({
  title: '',
  description: '',
  technologies: [],
  url: '',
  start_date: '',
  end_date: '',
})
const emptyCert = (): Partial<StudentCertification> => ({
  name: '',
  issuer: '',
  issue_date: '',
  expiry_date: '',
  credential_url: '',
})
const emptyExperience = (): Partial<StudentExperience> => ({
  title: '',
  organization: '',
  employment_type: 'internship',
  start_date: '',
  end_date: '',
  currently_working: false,
  description: '',
  location: '',
})

export default function StudentProfile() {
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [photoBusy, setPhotoBusy] = useState(false)

  const [skillOpen, setSkillOpen] = useState(false)
  const [skillDraft, setSkillDraft] = useState<Partial<StudentSkill>>(emptySkill())
  const [projectOpen, setProjectOpen] = useState(false)
  const [projectDraft, setProjectDraft] = useState<Partial<StudentProject>>(emptyProject())
  const [certOpen, setCertOpen] = useState(false)
  const [certDraft, setCertDraft] = useState<Partial<StudentCertification>>(emptyCert())
  const [expOpen, setExpOpen] = useState(false)
  const [expDraft, setExpDraft] = useState<Partial<StudentExperience>>(emptyExperience())
  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'skill' | 'project' | 'cert' | 'experience'
    id: string
    title: string
  } | null>(null)
  const [prefsSaving, setPrefsSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('details')

  const missingTabMap: Record<string, string> = {
    profile_details: 'details',
    education: 'education',
    skills: 'skills',
    projects: 'projects',
    certifications: 'certifications',
    experience: 'experience',
    career_preferences: 'preferences',
    profile_photo: 'details',
  }

  const fetchProfile = async () => {
    try {
      const data = await apiClient.getStudentProfile()
      setProfile(data)
    } catch (error) {
      console.error('Error fetching profile:', error)
      toast.error('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchProfile()
  }, [])

  const applyProfile = (data: any) => {
    if (data?.profile) {
      setProfile(data.profile)
      return
    }
    if (data?.id) setProfile(data)
  }

  const handleDetailsSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        name: profile?.name,
        phone: profile?.phone,
        bio: profile?.bio,
        institution: profile?.institution,
        degree: profile?.degree,
        branch: profile?.branch,
        graduation_year: profile?.graduation_year ? Number(profile.graduation_year) : null,
        dob: profile?.dob || null,
        gender: profile?.gender || null,
        city: profile?.city,
        state: profile?.state,
        country: profile?.country,
        tenth_grade_percentage: profile?.tenth_grade_percentage
          ? Number(profile.tenth_grade_percentage)
          : null,
        twelfth_grade_percentage: profile?.twelfth_grade_percentage
          ? Number(profile.twelfth_grade_percentage)
          : null,
        btech_cgpa: profile?.btech_cgpa ? Number(profile.btech_cgpa) : null,
        linkedin_profile: profile?.linkedin_profile,
        github_profile: profile?.github_profile,
        personal_website: profile?.personal_website,
      }
      const data = await apiClient.updateStudentProfile(payload)
      applyProfile(data)
      toast.success('Profile details saved')
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error('Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const handlePhoto = async (file?: File) => {
    if (!file) return
    setPhotoBusy(true)
    try {
      const data = await apiClient.uploadStudentProfilePicture(file)
      applyProfile(data)
      toast.success('Profile photo updated')
    } catch (error) {
      console.error(error)
      toast.error('Failed to upload photo')
    } finally {
      setPhotoBusy(false)
    }
  }

  const saveSkill = async () => {
    if (!skillDraft.name?.trim()) {
      toast.error('Skill name is required')
      return
    }
    try {
      const data = await apiClient.saveStudentSkill(
        { name: skillDraft.name, category: skillDraft.category, source: 'manual' },
        skillDraft.id,
      )
      applyProfile(data)
      setSkillOpen(false)
      toast.success('Skill saved')
    } catch {
      toast.error('Failed to save skill')
    }
  }

  const saveProject = async () => {
    if (!projectDraft.title?.trim()) {
      toast.error('Project title is required')
      return
    }
    try {
      const data = await apiClient.saveStudentProject(projectDraft, projectDraft.id)
      applyProfile(data)
      setProjectOpen(false)
      toast.success('Project saved')
    } catch {
      toast.error('Failed to save project')
    }
  }

  const saveCert = async () => {
    if (!certDraft.name?.trim()) {
      toast.error('Certification name is required')
      return
    }
    try {
      const data = await apiClient.saveStudentCertification(certDraft, certDraft.id)
      applyProfile(data)
      setCertOpen(false)
      toast.success('Certification saved')
    } catch {
      toast.error('Failed to save certification')
    }
  }

  const saveExperience = async () => {
    if (!expDraft.title?.trim()) {
      toast.error('Role title is required')
      return
    }
    try {
      const data = await apiClient.saveStudentExperience(expDraft, expDraft.id)
      applyProfile(data)
      setExpOpen(false)
      toast.success('Experience saved')
    } catch {
      toast.error('Failed to save experience')
    }
  }

  const savePreferences = async () => {
    setPrefsSaving(true)
    try {
      const prefs: CareerPreferences = {
        preferred_industries: profile?.career_preferences?.preferred_industries || [],
        job_roles: profile?.career_preferences?.job_roles || [],
        locations: profile?.career_preferences?.locations || [],
        work_mode: profile?.career_preferences?.work_mode || '',
        expected_ctc: profile?.career_preferences?.expected_ctc || '',
        job_type: profile?.career_preferences?.job_type || '',
      }
      const data = await apiClient.updateStudentCareerPreferences(prefs)
      applyProfile(data)
      toast.success('Career preferences saved')
    } catch {
      toast.error('Failed to save preferences')
    } finally {
      setPrefsSaving(false)
    }
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    try {
      let data
      if (deleteTarget.type === 'skill') data = await apiClient.deleteStudentSkill(deleteTarget.id)
      if (deleteTarget.type === 'project') data = await apiClient.deleteStudentProject(deleteTarget.id)
      if (deleteTarget.type === 'cert') data = await apiClient.deleteStudentCertification(deleteTarget.id)
      if (deleteTarget.type === 'experience') data = await apiClient.deleteStudentExperience(deleteTarget.id)
      applyProfile(data)
      toast.success('Deleted')
    } catch {
      toast.error('Failed to delete')
    } finally {
      setDeleteTarget(null)
    }
  }

  const skills: StudentSkill[] = profile?.skills || []
  const projects: StudentProject[] = profile?.projects || []
  const certs: StudentCertification[] = profile?.certifications_list || []
  const experience: StudentExperience[] = profile?.experience || []
  const completion = profile?.profile_completion_percentage ?? 0
  const strength = profile?.profile_strength
  const missing = profile?.profile_completion?.missing_sections || []
  const photoUrl = profileMediaUrl(profile?.profile_picture_url || profile?.profile_picture)

  return (
    <DashboardLayout requiredUserType="student">
      <div className="space-y-6">
        <motion.div
          className="relative overflow-hidden rounded-2xl p-6 sm:p-8 text-gray-900 dark:text-white border bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="pointer-events-none absolute -top-12 -right-12 w-56 h-56 rotate-45 bg-gradient-to-br from-primary-100/40 to-secondary-100/30 dark:from-primary-900/30 dark:to-secondary-900/20" />
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center gap-6">
            <div className="flex items-center gap-4 min-w-0">
              <label className="relative shrink-0 cursor-pointer group">
                <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-2xl overflow-hidden bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                  {photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={photoUrl} alt="Profile" className="h-full w-full object-cover" />
                  ) : (
                    (profile?.name || 'S').slice(0, 1).toUpperCase()
                  )}
                </div>
                <span className="absolute -bottom-1 -right-1 rounded-full bg-[#0068FC] p-1.5 text-white shadow-md group-hover:bg-[#0054cc]">
                  {photoBusy ? <Loader size="sm" /> : <Camera className="h-3.5 w-3.5" />}
                </span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  className="sr-only"
                  onChange={(e) => void handlePhoto(e.target.files?.[0])}
                />
              </label>
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="h-5 w-5 text-primary-600" />
                  <h1 className="text-2xl sm:text-4xl font-bold truncate">
                    <span className="bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">
                      Student
                    </span>{' '}
                    <span className="bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
                      Profile
                    </span>
                  </h1>
                </div>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
                  Keep your skills, projects, and career preferences up to date
                </p>
              </div>
            </div>
            <div className="flex-1 grid sm:grid-cols-2 gap-4">
              <div className="rounded-xl bg-white/70 dark:bg-gray-800/70 p-4 border border-gray-200/70 dark:border-gray-700">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Completion</p>
                <p className="text-2xl font-bold mt-1">{Math.round(completion)}%</p>
                <Progress value={completion} className="mt-2 h-2" />
              </div>
              <div className="rounded-xl bg-white/70 dark:bg-gray-800/70 p-4 border border-gray-200/70 dark:border-gray-700">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Strength score</p>
                <p className="text-2xl font-bold mt-1">
                  {Math.round(strength?.score || 0)}{' '}
                  <span className={`text-sm font-semibold ${strengthTone(strength?.level)}`}>
                    {strength?.level || 'Weak'}
                  </span>
                </p>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                  <div
                    className={`h-full ${strengthBarClass(strength?.level)}`}
                    style={{ width: `${Math.min(100, strength?.score || 0)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader size="lg" />
          </div>
        ) : (
          <>
            {missing.length > 0 ? (
              <div className="rounded-2xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 p-4">
                <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">Finish these sections</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {missing.map((section: string) =>
                    section === 'resume' ? (
                      <Link key={section} href="/dashboard/student/resume">
                        <Badge variant="warning">{SECTION_LABELS[section]}</Badge>
                      </Link>
                    ) : (
                      <button
                        key={section}
                        type="button"
                        onClick={() => setActiveTab(missingTabMap[section] || 'details')}
                      >
                        <Badge variant="warning">{SECTION_LABELS[section] || section}</Badge>
                      </button>
                    ),
                  )}
                </div>
              </div>
            ) : null}

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
              <div className="overflow-x-auto -mx-1 px-1 pb-1">
                <TabsList className="inline-flex w-max min-w-full h-auto gap-1 rounded-xl p-1.5 bg-white dark:bg-[#1C2938] border border-gray-200 dark:border-gray-700">
                  <TabsTrigger value="details" className="gap-1.5 rounded-lg px-3 py-2 data-[state=active]:bg-[#0068FC] data-[state=active]:text-white">
                    <User className="h-4 w-4" /> Details
                  </TabsTrigger>
                  <TabsTrigger value="education" className="gap-1.5 rounded-lg px-3 py-2 data-[state=active]:bg-[#0068FC] data-[state=active]:text-white">
                    <GraduationCap className="h-4 w-4" /> Education
                  </TabsTrigger>
                  <TabsTrigger value="skills" className="gap-1.5 rounded-lg px-3 py-2 data-[state=active]:bg-[#0068FC] data-[state=active]:text-white">
                    <Sparkles className="h-4 w-4" /> Skills
                  </TabsTrigger>
                  <TabsTrigger value="projects" className="gap-1.5 rounded-lg px-3 py-2 data-[state=active]:bg-[#0068FC] data-[state=active]:text-white">
                    <FolderKanban className="h-4 w-4" /> Projects
                  </TabsTrigger>
                  <TabsTrigger value="certifications" className="gap-1.5 rounded-lg px-3 py-2 data-[state=active]:bg-[#0068FC] data-[state=active]:text-white">
                    <Award className="h-4 w-4" /> Certifications
                  </TabsTrigger>
                  <TabsTrigger value="experience" className="gap-1.5 rounded-lg px-3 py-2 data-[state=active]:bg-[#0068FC] data-[state=active]:text-white">
                    <Briefcase className="h-4 w-4" /> Experience
                  </TabsTrigger>
                  <TabsTrigger value="preferences" className="gap-1.5 rounded-lg px-3 py-2 data-[state=active]:bg-[#0068FC] data-[state=active]:text-white">
                    <Target className="h-4 w-4" /> Preferences
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="details" className="mt-0">
                <form onSubmit={handleDetailsSubmit} className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1C2938] shadow-sm">
                <div className="flex items-center gap-3 border-b border-gray-200 dark:border-gray-700 px-5 py-4">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 shadow-md">
                    <User className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold">Profile details</h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Personal information used across Solviq</p>
                  </div>
                </div>
                <div className="p-5 grid md:grid-cols-2 gap-5">
                  <Field label="Full name">
                    <Input className={inputClass} value={profile?.name || ''} onChange={(e) => setProfile({ ...profile, name: e.target.value })} />
                  </Field>
                  <Field label="Email">
                    <Input className={`${inputClass} bg-gray-100 dark:bg-gray-800`} value={profile?.email || ''} disabled />
                  </Field>
                  <Field label="Phone">
                    <Input className={inputClass} value={profile?.phone || ''} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} />
                  </Field>
                  <Field label="Date of birth">
                    <Input type="date" className={inputClass} value={(profile?.dob || '').slice(0, 10)} onChange={(e) => setProfile({ ...profile, dob: e.target.value })} />
                  </Field>
                  <Field label="Gender">
                    <select
                      className={`flex h-10 w-full rounded-md border bg-white dark:bg-gray-800 px-3 text-sm ${inputClass}`}
                      value={profile?.gender || ''}
                      onChange={(e) => setProfile({ ...profile, gender: e.target.value })}
                    >
                      <option value="">Select</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </Field>
                  <Field label="City">
                    <Input className={inputClass} value={profile?.city || ''} onChange={(e) => setProfile({ ...profile, city: e.target.value })} />
                  </Field>
                  <Field label="State">
                    <Input className={inputClass} value={profile?.state || ''} onChange={(e) => setProfile({ ...profile, state: e.target.value })} />
                  </Field>
                  <Field label="Country">
                    <Input className={inputClass} value={profile?.country || ''} onChange={(e) => setProfile({ ...profile, country: e.target.value })} />
                  </Field>
                  <div className="md:col-span-2">
                    <Field label="Bio">
                      <Textarea value={profile?.bio || ''} onChange={(e) => setProfile({ ...profile, bio: e.target.value })} placeholder="A short summary about you" />
                    </Field>
                  </div>
                </div>
                <div className="px-5 pb-5">
                    <Button type="submit" disabled={saving} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white">
                      <Save className="mr-2 h-4 w-4" />
                      {saving ? <Loader size="sm" /> : 'Save details'}
                    </Button>
                  </div>
                </form>
              </TabsContent>

              <TabsContent value="education" className="mt-0">
                <form onSubmit={handleDetailsSubmit} className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1C2938] shadow-sm">
                <div className="flex items-center gap-3 border-b border-gray-200 dark:border-gray-700 px-5 py-4">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 shadow-md">
                    <GraduationCap className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold">Education</h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Academic background and grades</p>
                  </div>
                </div>
                <div className="p-5 grid md:grid-cols-2 gap-5">
                  <Field label="Institution">
                    <Input className={inputClass} value={profile?.institution || ''} onChange={(e) => setProfile({ ...profile, institution: e.target.value })} />
                  </Field>
                  <Field label="Degree">
                    <Input className={inputClass} value={profile?.degree || ''} onChange={(e) => setProfile({ ...profile, degree: e.target.value })} placeholder="e.g., B.Tech" />
                  </Field>
                  <Field label="Branch">
                    <Input className={inputClass} value={profile?.branch || ''} onChange={(e) => setProfile({ ...profile, branch: e.target.value })} />
                  </Field>
                  <Field label="Graduation year">
                    <Input type="number" className={inputClass} value={profile?.graduation_year || ''} onChange={(e) => setProfile({ ...profile, graduation_year: e.target.value })} />
                  </Field>
                  <Field label="10th %">
                    <Input type="number" step="0.01" className={inputClass} value={profile?.tenth_grade_percentage || ''} onChange={(e) => setProfile({ ...profile, tenth_grade_percentage: e.target.value })} />
                  </Field>
                  <Field label="12th %">
                    <Input type="number" step="0.01" className={inputClass} value={profile?.twelfth_grade_percentage || ''} onChange={(e) => setProfile({ ...profile, twelfth_grade_percentage: e.target.value })} />
                  </Field>
                  <Field label="CGPA">
                    <Input type="number" step="0.01" className={inputClass} value={profile?.btech_cgpa || ''} onChange={(e) => setProfile({ ...profile, btech_cgpa: e.target.value })} />
                  </Field>
                  <Field label="LinkedIn">
                    <Input className={inputClass} value={profile?.linkedin_profile || ''} onChange={(e) => setProfile({ ...profile, linkedin_profile: e.target.value })} />
                  </Field>
                  <Field label="GitHub">
                    <Input className={inputClass} value={profile?.github_profile || ''} onChange={(e) => setProfile({ ...profile, github_profile: e.target.value })} />
                  </Field>
                  <Field label="Website">
                    <Input className={inputClass} value={profile?.personal_website || ''} onChange={(e) => setProfile({ ...profile, personal_website: e.target.value })} />
                  </Field>
                </div>
                <div className="px-5 pb-5">
                  <Button type="submit" disabled={saving} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white">
                    <Save className="mr-2 h-4 w-4" />
                    {saving ? <Loader size="sm" /> : 'Save details'}
                  </Button>
                </div>
                </form>
              </TabsContent>

              <TabsContent value="skills" className="mt-0">
            <SkillsInventory
              skills={skills}
              onAdd={() => {
                setSkillDraft(emptySkill())
                setSkillOpen(true)
              }}
              onEdit={(skill) => {
                setSkillDraft(skill)
                setSkillOpen(true)
              }}
              onDelete={(skill) => setDeleteTarget({ type: 'skill', id: skill.id, title: skill.name })}
            />
              </TabsContent>

              <TabsContent value="projects" className="mt-0">
            <InventorySection
              title="Projects"
              description="Highlight academic and personal projects"
              icon={FolderKanban}
              emptyText="Add projects to strengthen your profile."
              onAdd={() => {
                setProjectDraft(emptyProject())
                setProjectOpen(true)
              }}
              addLabel="Add project"
              count={projects.length}
            >
              {projects.map((project) => (
                <InventoryItem
                  key={project.id}
                  title={project.title}
                  subtitle={project.description}
                  badges={project.technologies || []}
                  onEdit={() => {
                    setProjectDraft(project)
                    setProjectOpen(true)
                  }}
                  onDelete={() => setDeleteTarget({ type: 'project', id: project.id, title: project.title })}
                />
              ))}
            </InventorySection>
              </TabsContent>

              <TabsContent value="certifications" className="mt-0">
            <InventorySection
              title="Certifications"
              description="Courses and credentials that validate your skills"
              icon={Award}
              emptyText="Add certifications to boost your strength score."
              onAdd={() => {
                setCertDraft(emptyCert())
                setCertOpen(true)
              }}
              addLabel="Add certification"
              count={certs.length}
            >
              {certs.map((cert) => (
                <InventoryItem
                  key={cert.id}
                  title={cert.name}
                  subtitle={[cert.issuer, cert.issue_date].filter(Boolean).join(' · ')}
                  onEdit={() => {
                    setCertDraft(cert)
                    setCertOpen(true)
                  }}
                  onDelete={() => setDeleteTarget({ type: 'cert', id: cert.id, title: cert.name })}
                />
              ))}
            </InventorySection>
              </TabsContent>

              <TabsContent value="experience" className="mt-0">
            <InventorySection
              title="Experience"
              description="Internships, jobs, and relevant work"
              icon={Briefcase}
              emptyText="Add internships or work experience."
              onAdd={() => {
                setExpDraft(emptyExperience())
                setExpOpen(true)
              }}
              addLabel="Add experience"
              count={experience.length}
            >
              {experience.map((item) => (
                <InventoryItem
                  key={item.id}
                  title={item.title}
                  subtitle={[item.organization, item.location, item.description].filter(Boolean).join(' · ')}
                  badges={[item.employment_type || ''].filter(Boolean)}
                  onEdit={() => {
                    setExpDraft(item)
                    setExpOpen(true)
                  }}
                  onDelete={() => setDeleteTarget({ type: 'experience', id: item.id, title: item.title })}
                />
              ))}
            </InventorySection>
              </TabsContent>

              <TabsContent value="preferences" className="mt-0">
            <section className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1C2938] shadow-sm">
              <div className="flex items-center gap-3 border-b border-gray-200 dark:border-gray-700 px-5 py-4">
                <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 shadow-md">
                  <Target className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold">Career preferences</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Roles, industries, and locations you want to target</p>
                </div>
              </div>
              <div className="p-5 grid md:grid-cols-2 gap-5">
                <Field label="Preferred industries">
                  <ChipInput
                    values={profile?.career_preferences?.preferred_industries || []}
                    onChange={(preferred_industries) =>
                      setProfile({
                        ...profile,
                        career_preferences: { ...profile?.career_preferences, preferred_industries },
                      })
                    }
                    placeholder="e.g. Information Technology"
                  />
                </Field>
                <Field label="Job roles of interest">
                  <ChipInput
                    values={profile?.career_preferences?.job_roles || []}
                    onChange={(job_roles) =>
                      setProfile({
                        ...profile,
                        career_preferences: { ...profile?.career_preferences, job_roles },
                      })
                    }
                    placeholder="e.g. Software Engineer"
                  />
                </Field>
                <Field label="Location preferences">
                  <ChipInput
                    values={profile?.career_preferences?.locations || []}
                    onChange={(locations) =>
                      setProfile({
                        ...profile,
                        career_preferences: { ...profile?.career_preferences, locations },
                      })
                    }
                    placeholder="e.g. Bengaluru, Remote"
                  />
                </Field>
                <Field label="Work mode">
                  <select
                    className={`flex h-10 w-full rounded-md border bg-white dark:bg-gray-800 px-3 text-sm ${inputClass}`}
                    value={profile?.career_preferences?.work_mode || ''}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        career_preferences: { ...profile?.career_preferences, work_mode: e.target.value },
                      })
                    }
                  >
                    <option value="">Select</option>
                    <option value="remote">Remote</option>
                    <option value="hybrid">Hybrid</option>
                    <option value="onsite">On-site</option>
                  </select>
                </Field>
                <Field label="Job type">
                  <select
                    className={`flex h-10 w-full rounded-md border bg-white dark:bg-gray-800 px-3 text-sm ${inputClass}`}
                    value={profile?.career_preferences?.job_type || ''}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        career_preferences: { ...profile?.career_preferences, job_type: e.target.value },
                      })
                    }
                  >
                    <option value="">Select</option>
                    <option value="full-time">Full-time</option>
                    <option value="internship">Internship</option>
                    <option value="contract">Contract</option>
                  </select>
                </Field>
                <Field label="Expected CTC">
                  <Input
                    className={inputClass}
                    value={profile?.career_preferences?.expected_ctc || ''}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        career_preferences: { ...profile?.career_preferences, expected_ctc: e.target.value },
                      })
                    }
                    placeholder="e.g. 8-12 LPA"
                  />
                </Field>
              </div>
              <div className="px-5 pb-5">
                <Button type="button" onClick={() => void savePreferences()} disabled={prefsSaving} className="bg-[#0068FC] hover:bg-[#0054cc]">
                  <Save className="mr-2 h-4 w-4" />
                  {prefsSaving ? <Loader size="sm" /> : 'Save preferences'}
                </Button>
              </div>
            </section>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>

      <Dialog open={skillOpen} onOpenChange={setSkillOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{skillDraft.id ? 'Edit skill' : 'Add skill'}</DialogTitle>
          </DialogHeader>
          <Field label="Skill name">
            <Input value={skillDraft.name || ''} onChange={(e) => setSkillDraft({ ...skillDraft, name: e.target.value })} />
          </Field>
          <Field label="Category">
            <select
              className={`flex h-10 w-full rounded-md border bg-white dark:bg-gray-800 px-3 text-sm ${inputClass}`}
              value={skillDraft.category || 'technical'}
              onChange={(e) => setSkillDraft({ ...skillDraft, category: e.target.value as StudentSkill['category'] })}
            >
              <option value="technical">Technical</option>
              <option value="soft">Soft</option>
              <option value="domain">Domain</option>
              <option value="tool">Tool</option>
            </select>
          </Field>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setSkillOpen(false)}>Cancel</Button>
            <Button type="button" onClick={() => void saveSkill()}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={projectOpen} onOpenChange={setProjectOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{projectDraft.id ? 'Edit project' : 'Add project'}</DialogTitle>
          </DialogHeader>
          <Field label="Title">
            <Input value={projectDraft.title || ''} onChange={(e) => setProjectDraft({ ...projectDraft, title: e.target.value })} />
          </Field>
          <Field label="Description">
            <Textarea value={projectDraft.description || ''} onChange={(e) => setProjectDraft({ ...projectDraft, description: e.target.value })} />
          </Field>
          <Field label="Technologies">
            <ChipInput
              values={projectDraft.technologies || []}
              onChange={(technologies) => setProjectDraft({ ...projectDraft, technologies })}
              placeholder="e.g. React"
            />
          </Field>
          <Field label="URL">
            <Input value={projectDraft.url || ''} onChange={(e) => setProjectDraft({ ...projectDraft, url: e.target.value })} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Start">
              <Input type="month" value={projectDraft.start_date || ''} onChange={(e) => setProjectDraft({ ...projectDraft, start_date: e.target.value })} />
            </Field>
            <Field label="End">
              <Input type="month" value={projectDraft.end_date || ''} onChange={(e) => setProjectDraft({ ...projectDraft, end_date: e.target.value })} />
            </Field>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setProjectOpen(false)}>Cancel</Button>
            <Button type="button" onClick={() => void saveProject()}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={certOpen} onOpenChange={setCertOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{certDraft.id ? 'Edit certification' : 'Add certification'}</DialogTitle>
          </DialogHeader>
          <Field label="Name">
            <Input value={certDraft.name || ''} onChange={(e) => setCertDraft({ ...certDraft, name: e.target.value })} />
          </Field>
          <Field label="Issuer">
            <Input value={certDraft.issuer || ''} onChange={(e) => setCertDraft({ ...certDraft, issuer: e.target.value })} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Issued">
              <Input type="month" value={certDraft.issue_date || ''} onChange={(e) => setCertDraft({ ...certDraft, issue_date: e.target.value })} />
            </Field>
            <Field label="Expiry">
              <Input type="month" value={certDraft.expiry_date || ''} onChange={(e) => setCertDraft({ ...certDraft, expiry_date: e.target.value })} />
            </Field>
          </div>
          <Field label="Credential URL">
            <Input value={certDraft.credential_url || ''} onChange={(e) => setCertDraft({ ...certDraft, credential_url: e.target.value })} />
          </Field>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setCertOpen(false)}>Cancel</Button>
            <Button type="button" onClick={() => void saveCert()}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={expOpen} onOpenChange={setExpOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{expDraft.id ? 'Edit experience' : 'Add experience'}</DialogTitle>
          </DialogHeader>
          <Field label="Title">
            <Input value={expDraft.title || ''} onChange={(e) => setExpDraft({ ...expDraft, title: e.target.value })} />
          </Field>
          <Field label="Organization">
            <Input value={expDraft.organization || ''} onChange={(e) => setExpDraft({ ...expDraft, organization: e.target.value })} />
          </Field>
          <Field label="Type">
            <select
              className={`flex h-10 w-full rounded-md border bg-white dark:bg-gray-800 px-3 text-sm ${inputClass}`}
              value={expDraft.employment_type || 'internship'}
              onChange={(e) => setExpDraft({ ...expDraft, employment_type: e.target.value })}
            >
              <option value="internship">Internship</option>
              <option value="full-time">Full-time</option>
              <option value="part-time">Part-time</option>
              <option value="freelance">Freelance</option>
            </select>
          </Field>
          <Field label="Location">
            <Input value={expDraft.location || ''} onChange={(e) => setExpDraft({ ...expDraft, location: e.target.value })} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Start">
              <Input type="month" value={expDraft.start_date || ''} onChange={(e) => setExpDraft({ ...expDraft, start_date: e.target.value })} />
            </Field>
            <Field label="End">
              <Input type="month" disabled={!!expDraft.currently_working} value={expDraft.end_date || ''} onChange={(e) => setExpDraft({ ...expDraft, end_date: e.target.value })} />
            </Field>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={!!expDraft.currently_working}
              onChange={(e) => setExpDraft({ ...expDraft, currently_working: e.target.checked, end_date: e.target.checked ? '' : expDraft.end_date })}
            />
            Currently working here
          </label>
          <Field label="Description">
            <Textarea value={expDraft.description || ''} onChange={(e) => setExpDraft({ ...expDraft, description: e.target.value })} />
          </Field>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setExpOpen(false)}>Cancel</Button>
            <Button type="button" onClick={() => void saveExperience()}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDeleteDialog
        open={!!deleteTarget}
        title={deleteTarget?.title || 'item'}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
        onConfirm={() => void confirmDelete()}
      />
    </DashboardLayout>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">{label}</label>
      {children}
    </div>
  )
}
