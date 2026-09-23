"use client";

import { useEffect, useState } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AgentChip,
  AgentWorkspace,
  StepHeading,
  Surface,
} from "@/components/assessment-agent/AgentVisual";
import type { AssessmentAgentProfile } from "@/types/assessmentAgent";

interface ProfileStepProps {
  profile: AssessmentAgentProfile;
  studentName?: string;
  saving: boolean;
  onSave: (payload: Record<string, unknown>) => Promise<void>;
  onContinue: () => void;
}

function experienceCopy(years: number | null): string {
  if (years == null) return "Not specified";
  if (years <= 0) return "Fresher / 0–2 years";
  if (years <= 2) return "0–2 years";
  if (years <= 4) return "2–4 years";
  return `${years}+ years`;
}

function ChipEditor({
  values,
  onChange,
  placeholder,
}: {
  values: string[];
  onChange: (next: string[]) => void;
  placeholder: string;
}) {
  const [draft, setDraft] = useState("");
  const add = () => {
    const next = draft.trim();
    if (!next || values.includes(next)) {
      setDraft("");
      return;
    }
    onChange([...values, next]);
    setDraft("");
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {values.length === 0 && (
          <p className="text-sm text-slate-400">None listed yet</p>
        )}
        {values.map((value) => (
          <span key={value} className="inline-flex items-center gap-1">
            <AgentChip tone="accent">{value}</AgentChip>
            <button
              type="button"
              aria-label={`Remove ${value}`}
              className="text-slate-400 hover:text-slate-700"
              onClick={() => onChange(values.filter((item) => item !== value))}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </span>
        ))}
      </div>
      <div className="flex max-w-sm items-center gap-2">
        <Input
          value={draft}
          placeholder={placeholder}
          className="h-9"
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              add();
            }
          }}
        />
        <Button type="button" size="icon" variant="outline" className="h-9 w-9" onClick={add}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export function ProfileStep({
  profile,
  saving,
  onSave,
  onContinue,
}: ProfileStepProps) {
  const [editing, setEditing] = useState(false);
  const [education, setEducation] = useState(profile.education ?? "");
  const [fieldOfStudy, setFieldOfStudy] = useState(profile.field_of_study ?? "");
  const [experienceYears, setExperienceYears] = useState(
    profile.experience_years != null ? String(profile.experience_years) : "",
  );
  const [skills, setSkills] = useState<string[]>(profile.skills);
  const [targetRoles, setTargetRoles] = useState<string[]>(profile.target_roles);
  const [locations, setLocations] = useState<string[]>(profile.preferred_locations);

  useEffect(() => {
    setEducation(profile.education ?? "");
    setFieldOfStudy(profile.field_of_study ?? "");
    setExperienceYears(
      profile.experience_years != null ? String(profile.experience_years) : "",
    );
    setSkills(profile.skills);
    setTargetRoles(profile.target_roles);
    setLocations(profile.preferred_locations);
  }, [profile]);

  const persistAndContinue = async (thenContinue: boolean) => {
    const years =
      experienceYears.trim() === "" ? undefined : Number(experienceYears);
    try {
      await onSave({
        education: education.trim() || null,
        field_of_study: fieldOfStudy.trim() || null,
        experience_years: years != null && Number.isFinite(years) ? years : undefined,
        skills,
        target_roles: targetRoles,
        preferred_locations: locations,
        career_interests: profile.career_interests,
        expected_salary: profile.expected_salary,
        employment_preference: profile.employment_preference,
      });
      setEditing(false);
      if (thenContinue) onContinue();
    } catch {
      // Parent surfaces the error.
    }
  };

  return (
    <AgentWorkspace>
      <StepHeading
        title="Your Profile"
        subtitle="Review the information we found from your resume."
      />

      <div className="mb-4 flex justify-end">
        <Button type="button" variant="outline" size="sm" onClick={() => setEditing((value) => !value)}>
          {editing ? "Cancel" : "Edit Profile"}
        </Button>
      </div>

      <div className="space-y-4">
        <Surface>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Education</p>
          {editing ? (
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Input
                value={education}
                placeholder="Degree"
                onChange={(event) => setEducation(event.target.value)}
              />
              <Input
                value={fieldOfStudy}
                placeholder="Field of study"
                onChange={(event) => setFieldOfStudy(event.target.value)}
              />
            </div>
          ) : (
            <div className="mt-2">
              <p className="font-medium text-slate-900 dark:text-white">
                {education || "Not specified"}
              </p>
              <p className="text-sm text-slate-500">{fieldOfStudy || "Field of study not specified"}</p>
            </div>
          )}
        </Surface>

        <Surface>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Experience</p>
          {editing ? (
            <Input
              type="number"
              min={0}
              max={50}
              className="mt-3 max-w-[160px]"
              value={experienceYears}
              placeholder="Years"
              onChange={(event) => setExperienceYears(event.target.value)}
            />
          ) : (
            <p className="mt-2 font-medium text-slate-900 dark:text-white">
              {experienceCopy(
                experienceYears.trim() === "" ? null : Number(experienceYears),
              )}
            </p>
          )}
        </Surface>

        <Surface>
          <p className="mb-3 text-xs font-medium uppercase tracking-wide text-slate-400">Skills</p>
          {editing ? (
            <ChipEditor values={skills} onChange={setSkills} placeholder="Add a skill" />
          ) : (
            <div className="flex flex-wrap gap-2">
              {skills.length === 0 && <p className="text-sm text-slate-400">No skills extracted yet</p>}
              {skills.map((skill) => (
                <AgentChip key={skill} tone="accent">
                  {skill}
                </AgentChip>
              ))}
            </div>
          )}
        </Surface>

        <Surface>
          <p className="mb-3 text-xs font-medium uppercase tracking-wide text-slate-400">
            Target Roles
          </p>
          {editing ? (
            <ChipEditor
              values={targetRoles}
              onChange={setTargetRoles}
              placeholder="Add a role"
            />
          ) : (
            <div className="flex flex-wrap gap-2">
              {targetRoles.length === 0 && (
                <p className="text-sm text-slate-400">No target roles yet</p>
              )}
              {targetRoles.map((role) => (
                <AgentChip key={role}>{role}</AgentChip>
              ))}
            </div>
          )}
        </Surface>

        <Surface>
          <p className="mb-3 text-xs font-medium uppercase tracking-wide text-slate-400">
            Preferred Locations
          </p>
          {editing ? (
            <ChipEditor
              values={locations}
              onChange={setLocations}
              placeholder="Add a location"
            />
          ) : (
            <div className="flex flex-wrap gap-2">
              {locations.length === 0 && (
                <p className="text-sm text-slate-400">No locations listed yet</p>
              )}
              {locations.map((location) => (
                <AgentChip key={location}>{location}</AgentChip>
              ))}
            </div>
          )}
        </Surface>
      </div>

      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        {editing && (
          <Button
            type="button"
            variant="outline"
            loading={saving}
            disabled={saving}
            onClick={() => void persistAndContinue(false)}
          >
            Save changes
          </Button>
        )}
        <Button
          type="button"
          loading={saving}
          disabled={saving}
          onClick={() => void persistAndContinue(true)}
        >
          Continue
        </Button>
      </div>
    </AgentWorkspace>
  );
}
