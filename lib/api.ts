import axios, {
  AxiosInstance,
  AxiosResponse,
  AxiosProgressEvent,
  InternalAxiosRequestConfig,
} from "axios";
import { config } from "./config";
import toast from "react-hot-toast";

// Extend Axios config to include custom properties
interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

class ApiClient {
  public client: AxiosInstance;

  constructor() {
    const shouldLog =
      typeof window !== "undefined" && process.env.NODE_ENV !== "production";

    // Validate API base URL
    if (shouldLog && !config.api.fullUrl) {
      console.warn(
        "⚠️ API Base URL is not configured. Please set NEXT_PUBLIC_API_BASE_URL environment variable.",
      );
    }

    this.client = axios.create({
      baseURL: config.api.fullUrl,
      timeout: 180000, // 180 seconds timeout (3 minutes) for web scraping operations
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (shouldLog) {
      console.log("🚀 API Client initialized:", {
        baseURL: config.api.fullUrl || "(not configured)",
        timeout: "180s (3 minutes)",
      });
    }

    // Add request interceptor to include auth token
    this.client.interceptors.request.use(
      async (config: CustomAxiosRequestConfig) => {
        // Add API version prefix
        if (!config.url?.startsWith("/api/v1/")) {
          config.url = `/api/v1${config.url}`;
        }

        // FormData must not use application/json — browser sets multipart boundary
        if (typeof FormData !== "undefined" && config.data instanceof FormData) {
          delete config.headers["Content-Type"];
        }

        // Add auth token
        const token = localStorage.getItem("access_token");
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // Skip proactive refresh for refresh token endpoint itself to prevent infinite loop
        if (config.url?.includes("/auth/refresh")) {
          return config;
        }

        // Check if token is about to expire and refresh proactively
        const tokenExpiry = localStorage.getItem("token_expiry");
        if (tokenExpiry && Date.now() > parseInt(tokenExpiry) - 60000) {
          // Refresh 1 minute before expiry
          const refreshToken = localStorage.getItem("refresh_token");
          if (refreshToken) {
            try {
              const response = await this.refreshToken(refreshToken);
              localStorage.setItem("access_token", response.access_token);
              localStorage.setItem("refresh_token", response.refresh_token);
              localStorage.setItem(
                "token_expiry",
                String(Date.now() + 30 * 60 * 1000),
              ); // 30 minutes
              config.headers.Authorization = `Bearer ${response.access_token}`;
            } catch (error) {
              console.warn(
                "Proactive token refresh failed, continuing with existing token",
                error
              );
              // If refresh fails, don't clear tokens - let the response interceptor handle it
            }
          }
        }

        return config;
      },
      (error) => {
        return Promise.reject(error);
      },
    );

    // Add response interceptor to handle token refresh
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest: CustomAxiosRequestConfig = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          // Check if error message indicates session was invalidated (logged in on another device)
          const errorMessage = error.response?.data?.detail || "";
          const isSessionInvalidated =
            errorMessage.includes("Session expired or invalid") ||
            errorMessage.includes("Session not found");

          // If session was invalidated, don't try to refresh - just logout
          if (isSessionInvalidated) {
            console.warn("Session invalidated - user logged in on another device");
            this.clearAuthTokens();
            // Show user-friendly notification
            toast.error("You have been logged out. You logged in on another device.", {
              duration: 5000,
              icon: "🔐",
            });
            // Only redirect if we're not already on the login page
            if (window.location.pathname !== "/auth/login") {
              window.location.href = "/auth/login";
            }
            return Promise.reject(error);
          }

          try {
            const refreshToken = localStorage.getItem("refresh_token");
            if (refreshToken) {
              const response = await this.refreshToken(refreshToken);
              localStorage.setItem("access_token", response.access_token);
              localStorage.setItem("refresh_token", response.refresh_token);
              localStorage.setItem(
                "token_expiry",
                String(Date.now() + 30 * 60 * 1000),
              );

              originalRequest.headers.Authorization = `Bearer ${response.access_token}`;
              return this.client(originalRequest);
            }
          } catch (refreshError) {
            // Refresh failed, clear all auth data and redirect to login
            this.clearAuthTokens();
            // Only redirect if we're not already on the login page
            if (window.location.pathname !== "/auth/login") {
              window.location.href = "/auth/login";
            }
          }
        }

        // Handle subscription/license enforcement (403) globally
        if (error.response?.status === 403) {
          const detail = error.response?.data?.detail || "";
          const msg = typeof detail === "string" ? detail : "";
          const msgLower = msg.toLowerCase();
          const looksLikeEntitlement =
            (msgLower.includes("subscription") || msgLower.includes("license")) &&
            (msgLower.includes("expired") ||
              msgLower.includes("contact hirekarma") ||
              msgLower.includes("free plan"));

          if (looksLikeEntitlement && typeof window !== "undefined") {
            window.dispatchEvent(
              new CustomEvent("subscription-required", {
                detail: { message: msg },
              }),
            );
          }
        }

        return Promise.reject(error);
      },
    );
  }

  // Auth endpoints
  async registerStudent(data: any): Promise<any> {
    const response: AxiosResponse = await this.client.post(
      "/auth/register/student",
      data,
    );
    return response.data;
  }

  // Guest free readiness check (no auth)
  async guestReadinessCatalog(): Promise<{ target_roles: string[]; branches: string[] }> {
    const response: AxiosResponse = await this.client.get("/guest-readiness/catalog");
    return response.data;
  }

  async guestReadinessStart(): Promise<{ session_token: string }> {
    const response: AxiosResponse = await this.client.post("/guest-readiness/start");
    return response.data;
  }

  async guestReadinessSetProfile(token: string, target_role: string, branch: string): Promise<any> {
    const response: AxiosResponse = await this.client.put(`/guest-readiness/${token}/profile`, {
      target_role,
      branch,
    });
    return response.data;
  }

  async guestReadinessUploadResume(token: string, file: File): Promise<any> {
    const form = new FormData();
    form.append("file", file);
    const response: AxiosResponse = await this.client.post(
      `/guest-readiness/${token}/resume`,
      form,
    );
    return response.data;
  }

  async guestReadinessGetQuiz(token: string): Promise<{ questions: any[] }> {
    const response: AxiosResponse = await this.client.get(`/guest-readiness/${token}/quiz`);
    return response.data;
  }

  async guestReadinessSubmitQuiz(token: string, answers: Record<string, string>): Promise<any> {
    const response: AxiosResponse = await this.client.post(
      `/guest-readiness/${token}/quiz/submit`,
      { answers },
    );
    return response.data;
  }

  async guestReadinessGetResults(token: string): Promise<any> {
    const response: AxiosResponse = await this.client.get(`/guest-readiness/${token}/results`);
    return response.data;
  }

  async login(data: any): Promise<any> {
    console.log(
      "📡 API login POST:",
      this.client.defaults.baseURL + "/api/v1/auth/login",
      data,
    );
    const response: AxiosResponse = await this.client.post("/auth/login", data);
    console.log("📥 Login response:", response.data);
    return response.data;
  }

  async refreshToken(refreshToken: string): Promise<any> {
    const response: AxiosResponse = await this.client.post("/auth/refresh", {
      refresh_token: refreshToken,
    });
    return response.data;
  }

  async logout(): Promise<any> {
    const response: AxiosResponse = await this.client.post("/auth/logout");
    return response.data;
  }

  async getCurrentUser(): Promise<any> {
    const response: AxiosResponse = await this.client.get("/auth/me");
    return response.data;
  }

  // Helper methods
  setAuthTokens(accessToken: string, refreshToken: string): void {
    localStorage.setItem("access_token", accessToken);
    localStorage.setItem("refresh_token", refreshToken);
  }

  clearAuthTokens() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("token_expiry");
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem("access_token");
  }

  getAccessToken(): string | null {
    return localStorage.getItem("access_token");
  }

  // Admin endpoints
  async getAdminDashboard(): Promise<any> {
    const response: AxiosResponse = await this.client.get("/admin/dashboard");
    return response.data;
  }

  async getColleges(params?: any): Promise<any> {
    const response: AxiosResponse = await this.client.get("/admin/colleges", {
      params,
    });
    return response.data;
  }

  async createCollege(data: any): Promise<any> {
    const response: AxiosResponse = await this.client.post(
      "/admin/colleges",
      data,
    );
    return response.data;
  }

  async updateCollege(id: string, data: any): Promise<any> {
    const response: AxiosResponse = await this.client.put(
      `/admin/colleges/${id}`,
      data,
    );
    return response.data;
  }

  async deactivateCollege(id: string): Promise<any> {
    const response: AxiosResponse = await this.client.put(
      `/admin/colleges/${id}/deactivate`,
    );
    return response.data;
  }

  async activateCollege(id: string): Promise<any> {
    const response: AxiosResponse = await this.client.put(
      `/admin/colleges/${id}/activate`,
    );
    return response.data;
  }

  async deleteCollege(id: string): Promise<any> {
    const response: AxiosResponse = await this.client.delete(
      `/admin/colleges/${id}`,
    );
    return response.data;
  }

  async updateCollegeLicense(id: string, data: {
    license_type: string;
    license_expiry?: string;
    total_students?: number;
  }): Promise<any> {
    const response: AxiosResponse = await this.client.put(
      `/admin/colleges/${id}/license`,
      data,
    );
    return response.data;
  }

  async getStudents(params?: any): Promise<any> {
    const response: AxiosResponse = await this.client.get("/admin/students", {
      params,
    });
    return response.data;
  }

  async createStudent(data: any): Promise<any> {
    const response: AxiosResponse = await this.client.post(
      "/admin/students",
      data,
    );
    return response.data;
  }

  async updateStudent(id: string, data: any): Promise<any> {
    const response: AxiosResponse = await this.client.put(
      `/admin/students/${id}`,
      data,
    );
    return response.data;
  }

  async deactivateStudent(id: string): Promise<any> {
    const response: AxiosResponse = await this.client.put(
      `/admin/students/${id}/deactivate`,
    );
    return response.data;
  }

  async activateStudent(id: string): Promise<any> {
    const response: AxiosResponse = await this.client.put(
      `/admin/students/${id}/activate`,
    );
    return response.data;
  }

  async deleteStudent(id: string): Promise<any> {
    const response: AxiosResponse = await this.client.delete(
      `/admin/students/${id}`,
    );
    return response.data;
  }

  async updateStudentSubscription(id: string, data: {
    subscription_type: 'free' | 'premium' | 'college_license';
    subscription_expiry?: string;
  }): Promise<any> {
    const response: AxiosResponse = await this.client.put(
      `/admin/students/${id}/subscription`,
      data,
    );
    return response.data;
  }

  async uploadStudentsCSV(file: File, collegeId?: string): Promise<any> {
    const formData = new FormData();
    formData.append("file", file);
    if (collegeId) {
      formData.append("college_id", collegeId);
      console.log("📤 Uploading CSV with college_id:", collegeId);
    } else {
      console.log("📤 Uploading CSV without college_id");
    }
    const response: AxiosResponse = await this.client.post(
      "/admin/students/upload-csv",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );
    return response.data;
  }

  // College endpoints
  async getCollegeDashboard(): Promise<any> {
    const response: AxiosResponse = await this.client.get("/college/dashboard");
    return response.data;
  }

  async getCollegeAnalytics(): Promise<any> {
    const response: AxiosResponse = await this.client.get("/college/analytics");
    return response.data;
  }

  async getCollegeProfile(): Promise<any> {
    const response: AxiosResponse = await this.client.get("/college/profile");
    return response.data;
  }

  async updateCollegeProfile(data: any): Promise<any> {
    const response: AxiosResponse = await this.client.put(
      "/college/profile",
      data,
    );
    return response.data;
  }

  async getCollegeStudents(params?: any): Promise<any> {
    const response: AxiosResponse = await this.client.get("/college/students", {
      params,
    });
    return response.data;
  }

  async createCollegeStudent(data: any): Promise<any> {
    const response: AxiosResponse = await this.client.post(
      "/college/students",
      data,
    );
    return response.data;
  }

  async updateCollegeStudent(id: string, data: any): Promise<any> {
    const response: AxiosResponse = await this.client.put(
      `/college/students/${id}`,
      data,
    );
    return response.data;
  }

  async deleteCollegeStudent(id: string): Promise<any> {
    const response: AxiosResponse = await this.client.delete(
      `/college/students/${id}`,
    );
    return response.data;
  }

  async getCollegeStudentAnalytics(studentId: string): Promise<any> {
    const response: AxiosResponse = await this.client.get(
      `/college/students/${studentId}/analytics`
    );
    return response.data;
  }

  async activateCollegeStudent(id: string): Promise<any> {
    const response: AxiosResponse = await this.client.put(
      `/college/students/${id}/activate`,
    );
    return response.data;
  }

  async updateCollegeStudentSubscription(id: string, data: {
    subscription_type: 'free' | 'premium' | 'college_license';
    subscription_expiry?: string;
  }): Promise<any> {
    const response: AxiosResponse = await this.client.put(
      `/college/students/${id}/subscription`,
      data,
    );
    return response.data;
  }

  async uploadCollegeStudentsCSV(file: File): Promise<any> {
    const formData = new FormData();
    formData.append("file", file);
    const response: AxiosResponse = await this.client.post(
      "/college/students/upload-csv",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );
    return response.data;
  }

  // ✅ Student endpoints - ALL using /students/ (plural)
  async getStudentDashboard(): Promise<any> {
    const response: AxiosResponse = await this.client.get(
      "/students/dashboard",
    );
    return response.data;
  }

  async getStudentProfile(): Promise<any> {
    const response: AxiosResponse = await this.client.get("/students/profile");
    return response.data;
  }

  async updateStudentProfile(data: any): Promise<any> {
    const response: AxiosResponse = await this.client.put(
      "/students/profile",
      data,
    );
    return response.data;
  }

  /**
   * Upload resume with progress tracking
   * @param file - Resume file (PDF/DOCX)
   * @param onProgress - Optional callback for upload progress (0-100)
   * @returns Upload response with file details
   */
  async uploadResume(
    file: File,
    onProgress?: (progress: number) => void,
  ): Promise<any> {
    const formData = new FormData();
    formData.append("file", file);

    const response: AxiosResponse = await this.client.post(
      "/students/resume/upload", // ✅ /students/
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (progressEvent: AxiosProgressEvent) => {
          if (progressEvent.total && onProgress) {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total,
            );
            onProgress(percentCompleted);
          }
        },
      },
    );
    return response.data;
  }

  /**
   * Get resume status
   * @returns Resume status and details
   */
  async getResumeStatus(): Promise<any> {
    const response: AxiosResponse = await this.client.get(
      "/students/resume/status",
    ); // ✅ /students/
    return response.data;
  }

  /**
   * Get ATS score for uploaded resume
   * @param jobDescription - Optional job description for better matching
   * @returns ATS score analysis with recommendations
   */
  async getATSScore(jobDescription?: string): Promise<any> {
    const params = jobDescription ? { job_description: jobDescription } : {};
    const response: AxiosResponse = await this.client.get(
      "/students/ats-score",
      { params },
    ); // ✅ /students/
    return response.data;
  }

  /**
   * Get job recommendations based on resume
   * @returns Top 15 job recommendations with match scores
   */
  async getJobRecommendations(): Promise<any> {
    const response: AxiosResponse = await this.client.get(
      "/students/job-recommendations",
    ); // ✅ /students/
    return response.data;
  }

  /**
   * Get available jobs in the market from multiple platforms (LinkedIn, Unstop, Foundit, Naukri)
   * @param keywords - Optional comma-separated keywords (e.g., "software engineer,data analyst")
   * @param location - Job location (default: "India")
   * @param maxJobs - Maximum number of jobs to fetch per source (default: 15, max: 15)
   * @param includeResumeSkills - Include skills extracted from resume (default: false)
   * @param sources - Comma-separated platforms to search (e.g., "linkedin,unstop,foundit,naukri")
   * @returns Live job listings from selected platforms
   */
  async getMarketJobs(
    keywords?: string,
    location: string = "India",
    maxJobs: number = 15,
    includeResumeSkills: boolean = false,
    sources: string = "linkedin",
  ): Promise<any> {
    const params: any = {
      location,
      max_jobs: maxJobs,
      include_resume_skills: includeResumeSkills,
      sources,
    };
    if (keywords) {
      params.keywords = keywords;
    }
    // Use extended timeout for web scraping operations (3 minutes)
    const response: AxiosResponse = await this.client.get(
      "/students/market-jobs",
      {
        params,
        timeout: 180000, // 3 minutes for web scraping (increased from 2 minutes)
      },
    );
    return response.data;
  }

  /**
   * Get skills extracted from student's resume
   * @returns Extracted skills from ATS analysis
   */
  async getResumeSkills(): Promise<any> {
    const response: AxiosResponse = await this.client.get(
      "/students/resume-skills",
    );
    return response.data;
  }

  /**
   * Get student assessments history
   * @param skip - Number of records to skip (pagination)
   * @param limit - Number of records to return (pagination)
   * @returns Assessment history
   */
  // NOTE: See the unified implementation near the bottom of the file.

  /**
   * Get student performance analytics
   * @returns Performance analytics data
   */
  // NOTE: See the unified implementation near the bottom of the file.

  /**
   * Get subscription status and details
   * @returns Subscription information
   */
  async getSubscriptionStatus(): Promise<any> {
    const response: AxiosResponse = await this.client.get(
      "/students/subscription",
    ); // ✅ /students/
    return response.data;
  }

  // Assessment endpoints
  async getJobRoles(): Promise<any> {
    const response: AxiosResponse = await this.client.get(
      "/assessments/job-roles",
    );
    return response.data;
  }

  async startAssessment(jobRoleId: string): Promise<any> {
    const response: AxiosResponse = await this.client.post(
      "/assessments/start",
      {
        job_role_id: jobRoleId,
      },
    );
    return response.data;
  }

  async getAssessmentRound(
    assessmentId: string,
    roundNumber: number,
  ): Promise<any> {
    const response: AxiosResponse = await this.client.get(
      `/assessments/${assessmentId}/rounds/${roundNumber}`,
    );
    return response.data;
  }

  async submitRoundResponses(
    assessmentId: string,
    roundId: string,
    responses: any[],
  ): Promise<any> {
    const response: AxiosResponse = await this.client.post(
      `/assessments/${assessmentId}/rounds/${roundId}/submit`,
      responses,
    );
    return response.data;
  }

  async executeCode(
    assessmentId: string,
    roundId: string,
    payload: {
      question_id: string;
      language: string;
      code: string;
      stdin?: string;
    },
  ): Promise<any> {
    // Judge0 executions can take longer; override the default 30s client timeout for this call
    const response: AxiosResponse = await this.client.post(
      `/assessments/${assessmentId}/rounds/${roundId}/code/execute`,
      payload,
      { timeout: 60000 }, // 60s
    );
    return response.data;
  }

  async submitVoiceResponse(
    assessmentId: string,
    roundId: string,
    formData: FormData,
  ): Promise<any> {
    const response: AxiosResponse = await this.client.post(
      `/assessments/${assessmentId}/rounds/${roundId}/voice-response`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );
    return response.data;
  }

  async completeAssessment(assessmentId: string): Promise<any> {
    const response: AxiosResponse = await this.client.post(
      `/assessments/${assessmentId}/complete`,
    );
    return response.data;
  }

  async getAssessmentStatus(assessmentId: string): Promise<any> {
    const response: AxiosResponse = await this.client.get(
      `/assessments/${assessmentId}/status`,
    );
    return response.data;
  }

  async getAssessmentReport(assessmentId: string): Promise<any> {
    const response: AxiosResponse = await this.client.get(
      `/assessments/${assessmentId}/report`,
    );
    return response.data;
  }

  async getAssessmentReportWithQuestions(assessmentId: string): Promise<any> {
    const response: AxiosResponse = await this.client.get(
      `/assessments/${assessmentId}/report`,
      {
        params: { include: "questions" },
      },
    );
    return response.data;
  }

  async getAssessmentQA(assessmentId: string): Promise<any> {
    const response: AxiosResponse = await this.client.get(
      `/assessments/${assessmentId}/qa`,
    );
    return response.data;
  }

  async getAssessmentPlaylist(
    assessmentId: string,
    max_results?: number,
  ): Promise<any> {
    const response: AxiosResponse = await this.client.get(
      `/assessments/${assessmentId}/playlist`,
      {
        params: max_results ? { max_results } : {},
      },
    );
    return response.data;
  }

  async getStudentAssessments(
    skip: number = 0,
    limit: number = 50,
  ): Promise<any> {
    const response: AxiosResponse = await this.client.get(
      "/students/assessments",
      {
        params: { skip, limit },
      },
    );
    return response.data;
  }

  async getStudentAnalytics(): Promise<any> {
    const response: AxiosResponse = await this.client.get(
      "/students/analytics",
    );
    return response.data;
  }

  async getStudentAnalyticsWithFilters(
    params: {
      start_date?: string;
      end_date?: string;
      categories?: string;
    } = {},
  ): Promise<any> {
    const response: AxiosResponse = await this.client.get(
      "/students/analytics",
      { params },
    );
    return response.data;
  }

  async getStudentTimeline(
    params: {
      start_date?: string;
      end_date?: string;
      categories?: string;
    } = {},
  ): Promise<any> {
    const response: AxiosResponse = await this.client.get(
      "/students/analytics/timeline",
      { params },
    );
    return response.data;
  }

  async getStudentSubscriptionStatus(): Promise<any> {
    const response: AxiosResponse = await this.client.get(
      "/students/subscription-status",
    );
    return response.data;
  }

  async getStudentUsageAnalytics(): Promise<any> {
    const response: AxiosResponse = await this.client.get(
      "/students/usage-analytics",
    );
    return response.data;
  }

  // ============================================================================
  // PHASE 2: COLLEGE SUBSCRIPTION & LICENSE ANALYTICS ENDPOINTS
  // ============================================================================

  async getCollegeLicenseOverview(): Promise<any> {
    const response: AxiosResponse = await this.client.get(
      "/college/license-overview",
    );
    return response.data;
  }

  async getStudentSubscriptionDistribution(): Promise<any> {
    const response: AxiosResponse = await this.client.get(
      "/college/subscription-distribution",
    );
    return response.data;
  }

  async getUsageAnalyticsBySubscription(): Promise<any> {
    const response: AxiosResponse = await this.client.get(
      "/college/usage-analytics-by-subscription",
    );
    return response.data;
  }

  async getSubscriptionHealth(): Promise<any> {
    const response: AxiosResponse = await this.client.get(
      "/college/subscription-health",
    );
    return response.data;
  }

  // ============================================================================
  // PHASE 3: ADMIN SUBSCRIPTION & BUSINESS ANALYTICS ENDPOINTS
  // ============================================================================

  async getAdminSubscriptionOverview(): Promise<any> {
    const response: AxiosResponse = await this.client.get(
      "/admin/subscription-overview",
    );
    return response.data;
  }

  async getAdminCollegeLicenses(): Promise<any> {
    const response: AxiosResponse = await this.client.get(
      "/admin/college-licenses",
    );
    return response.data;
  }

  async getAdminSubscriptionTrends(): Promise<any> {
    const response: AxiosResponse = await this.client.get(
      "/admin/subscription-trends",
    );
    return response.data;
  }

  async getAdminRevenueMetrics(): Promise<any> {
    const response: AxiosResponse = await this.client.get(
      "/admin/revenue-metrics",
    );
    return response.data;
  }

  // Career Guidance API
  careerGuidance = {
    startSession: async (data: {
      resume_included: boolean;
      preferred_language: string;
    }): Promise<any> => {
      const response = await this.client.post("/career-guidance/start", data);
      return response.data;
    },

    sendMessage: async (data: {
      session_id: string;
      message: string;
    }): Promise<any> => {
      const response = await this.client.post("/career-guidance/message", data);
      return response.data;
    },

    getSession: async (sessionId: string): Promise<any> => {
      const response = await this.client.get(
        `/career-guidance/session/${sessionId}`,
      );
      return response.data;
    },

    getSessions: async (): Promise<any> => {
      const response = await this.client.get("/career-guidance/sessions");
      return response.data;
    },

    deleteSession: async (sessionId: string): Promise<any> => {
      const response = await this.client.delete(
        `/career-guidance/session/${sessionId}`,
      );
      return response.data;
    },
  };

  async getCareerGuidancePlaylist(sessionId: string): Promise<any> {
    const response = await this.client.get(
      `/career-guidance/session/${sessionId}/playlist`,
    );
    return response.data;
  }

  // Admin Analytics API
  async getAdminAnalytics(
    startDate?: string,
    endDate?: string,
    collegeId?: string
  ): Promise<any> {
    const params: any = {};
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;
    if (collegeId) params.college_id = collegeId;

    const response = await this.client.get("/admin/analytics", { params });
    return response.data;
  }

  async exportAnalytics(
    format: string = 'json',
    startDate?: string,
    endDate?: string,
    collegeId?: string
  ): Promise<any> {
    const params: any = { format };
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;
    if (collegeId) params.college_id = collegeId;

    const response = await this.client.post("/admin/analytics/export", null, { params });
    return response.data;
  }

  // Admin - Student Assessment Reports
  async getStudentAssessmentsAdmin(studentId: string): Promise<any> {
    const response = await this.client.get(`/admin/students/${studentId}/assessments`);
    return response.data;
  }

  async getStudentAssessmentReportAdmin(
    studentId: string,
    assessmentId: string,
    includeQuestions: boolean = false
  ): Promise<any> {
    const params: any = {};
    if (includeQuestions) params.include = 'questions';

    const response = await this.client.get(
      `/admin/students/${studentId}/assessments/${assessmentId}/report`,
      { params }
    );
    return response.data;
  }

  // College - Student Assessment Reports
  async getStudentAssessmentsCollege(studentId: string): Promise<any> {
    const response = await this.client.get(`/college/students/${studentId}/assessments`);
    return response.data;
  }

  async getStudentAssessmentReportCollege(
    studentId: string,
    assessmentId: string,
    includeQuestions: boolean = false
  ): Promise<any> {
    const params: any = {};
    if (includeQuestions) params.include = 'questions';

    const response = await this.client.get(
      `/college/students/${studentId}/assessments/${assessmentId}/report`,
      { params }
    );
    return response.data;
  }

  // Electrical endpoints
  async generateElectricalQuestion(): Promise<any> {
    const response: AxiosResponse = await this.client.post('/assessments/electrical/generate');
    return response.data;
  }

  async evaluateElectricalDiagram(payload: { question: string; drawing: any }): Promise<any> {
    const response: AxiosResponse = await this.client.post('/assessments/electrical/evaluate', payload, {
      timeout: 180000,
    });
    return response.data;
  }

  // Civil Engineering endpoints
  async generateCivilProblem(): Promise<any> {
    const response: AxiosResponse = await this.client.post('/assessments/civil/problem');
    return response.data;
  }

  async evaluateCivilQuantities(payload: {
    problem: Record<string, any>;  // Complete problem object for AI evaluation
    student_answers: Record<string, number>;
  }): Promise<any> {
    const response: AxiosResponse = await this.client.post('/assessments/civil/evaluate', payload, {
      timeout: 60000,  // AI evaluation may take longer
    });
    return response.data;
  }

  // Practice Coding endpoints
  async getPracticeCodingQuestions(branch: string, difficulty: string, timestamp?: number): Promise<any> {
    const params: any = { branch, difficulty };
    // Add timestamp for cache-busting to ensure fresh question generation
    if (timestamp) {
      params._t = timestamp;
    }
    const response: AxiosResponse = await this.client.get('/practice/coding', { params });
    return response.data;
  }

  async executePracticeCode(payload: {
    question_id: string;
    language: string;
    code: string;
    stdin?: string;
  }): Promise<any> {
    // Use extended timeout for code execution
    const response: AxiosResponse = await this.client.post('/practice/coding/execute', payload, {
      timeout: 60000
    });
    return response.data;
  }

  async evaluatePracticeCodingSubmission(payload: {
    branch: string;
    difficulty: string;
    items: Array<{
      question_id: string;
      question_text: string;
      code: string;
      language: string;
      test_results?: any;
    }>;
  }): Promise<any> {
    // Use extended timeout for AI evaluation
    const response: AxiosResponse = await this.client.post('/practice/coding/evaluate', payload, {
      timeout: 120000
    });
    return response.data;
  }

  // Excel Accountant Assessment endpoints
  public excelAssessment = {
    getAssessments: async (): Promise<any[]> => {
      const response: AxiosResponse = await this.client.get('/excel-assessment/assessments');
      return response.data;
    },

    createAssessment: async (payload: {
      title: string;
      description: string;
      num_questions: number;
      difficulty_level?: string;
    }): Promise<any> => {
      const response: AxiosResponse = await this.client.post('/excel-assessment/assessments', payload);
      return response.data;
    },

    getAssessmentDetail: async (id: string): Promise<any> => {
      const response: AxiosResponse = await this.client.get(`/excel-assessment/assessments/${id}`);
      return response.data;
    },

    // Backwards-compatible alias used by some components
    getAssessment: async (id: string): Promise<any> => {
      const response: AxiosResponse = await this.client.get(`/excel-assessment/assessments/${id}`);
      return response.data;
    },

    getAssessmentReport: async (id: string): Promise<any> => {
      const response: AxiosResponse = await this.client.get(`/excel-assessment/assessments/${id}/report`);
      return response.data;
    },

    startAssessment: async (id: string): Promise<any> => {
      const response: AxiosResponse = await this.client.post(`/excel-assessment/assessments/${id}/start`, {});
      return response.data;
    },

    submitExcelFile: async (assessmentId: string, questionId: string, file: File): Promise<any> => {
      const formData = new FormData();
      formData.append("file", file);
      const response: AxiosResponse = await this.client.post(
        `/excel-assessment/assessments/${assessmentId}/questions/${questionId}/submit-file`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return response.data;
    },

    submitSpreadsheetData: async (assessmentId: string, questionId: string, data: any): Promise<any> => {
      const response: AxiosResponse = await this.client.post(
        `/excel-assessment/assessments/${assessmentId}/submit-data/${questionId}`,
        data
      );
      return response.data;
    },

    completeAssessment: async (assessmentId: string): Promise<any> => {
      const response: AxiosResponse = await this.client.post(
        `/excel-assessment/assessments/${assessmentId}/complete`
      );
      return response.data;
    },
  };

  // Disha Assessment endpoints
  async getDishaPackageStatus(packageId: string): Promise<any> {
    const response: AxiosResponse = await this.client.get(
      `/disha/assessments/${packageId}`
    );
    return response.data;
  }

  async getDishaGenerationStatus(packageId: string): Promise<any> {
    const response: AxiosResponse = await this.client.get(
      `/disha/assessments/${packageId}/generation-status`
    );
    return response.data;
  }

  async getDishaPackageQuestions(packageId: string): Promise<any> {
    const response: AxiosResponse = await this.client.get(
      `/disha/assessments/${packageId}/questions`
    );
    return response.data;
  }

  async triggerDishaQuestionGeneration(packageId: string): Promise<any> {
    const response: AxiosResponse = await this.client.post(
      `/disha/assessments/${packageId}/generate-questions`
    );
    return response.data;
  }

  async getAllDishaPackages(params?: {
    status?: string;
    mode?: string;
    include_expired?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<any> {
    const response: AxiosResponse = await this.client.get(
      `/disha/admin/packages`,
      { params }
    );
    return response.data;
  }

  async deleteDishaPackage(packageId: string): Promise<any> {
    const response: AxiosResponse = await this.client.delete(
      `/disha/admin/packages/${packageId}`
    );
    return response.data;
  }

  // DISHA Exam APIs
  async startDishaAssessment(packageId: string, dishaStudentId: string): Promise<any> {
    const response: AxiosResponse = await this.client.post(
      `/disha/assessments/${packageId}/start`,
      { disha_student_id: dishaStudentId }
    );
    return response.data;
  }

  async getDishaRoundQuestions(
    packageId: string,
    roundId: string,
    attemptId: string
  ): Promise<any> {
    const response: AxiosResponse = await this.client.get(
      `/disha/assessments/${packageId}/rounds/${roundId}`,
      { params: { attempt_id: attemptId } }
    );
    return response.data;
  }

  async submitDishaRound(
    packageId: string,
    roundId: string,
    attemptId: string,
    answers: Record<string, any>
  ): Promise<any> {
    const response: AxiosResponse = await this.client.post(
      `/disha/assessments/${packageId}/rounds/${roundId}/submit`,
      {
        attempt_id: attemptId,
        answers: answers
      }
    );
    return response.data;
  }

  async executeDishaCode(
    packageId: string,
    roundId: string,
    payload: {
      question_id: string;
      language: string;
      code: string;
      stdin?: string;
    },
  ): Promise<any> {
    const response: AxiosResponse = await this.client.post(
      `/disha/assessments/${packageId}/rounds/${roundId}/code/execute`,
      payload,
      { timeout: 60000 },
    );
    return response.data;
  }


  async getDishaAttemptStatus(packageId: string, attemptId: string): Promise<any> {
    const response: AxiosResponse = await this.client.get(
      `/disha/assessments/${packageId}/attempts/${attemptId}/status`
    );
    return response.data;
  }

  async uploadDishaProctoringSnapshot(
    packageId: string,
    attemptId: string,
    dishaStudentId: string,
    snapshotIndex: number,
    imageBlob: Blob,
    roundNumber?: number
  ): Promise<any> {
    const formData = new FormData();
    formData.append('snapshot_index', String(snapshotIndex));
    formData.append('disha_student_id', dishaStudentId);
    formData.append('file', imageBlob, `snapshot_${snapshotIndex}.jpg`);
    if (roundNumber != null) {
      formData.append('round_number', String(roundNumber));
    }
    // Let axios set Content-Type with boundary — do not set multipart/form-data manually
    const response: AxiosResponse = await this.client.post(
      `/disha/assessments/${packageId}/attempts/${attemptId}/proctoring/snapshots`,
      formData
    );
    return response.data;
  }

  async getDishaEvaluationStatus(packageId: string, attemptId: string): Promise<any> {
    const response: AxiosResponse = await this.client.get(
      `/disha/assessments/${packageId}/attempts/${attemptId}/evaluation-status`
    );
    return response.data;
  }

  async getDishaReport(attemptId: string): Promise<any> {
    const response: AxiosResponse = await this.client.get(
      `/disha/assessments/${attemptId}/report`
    );
    return response.data;
  }

  // Admin DISHA APIs
  async getDishaPackageAttempts(packageId: string): Promise<any> {
    const response: AxiosResponse = await this.client.get(
      `/disha/admin/packages/${packageId}/attempts`
    );
    return response.data;
  }

  async getDishaPackageReport(packageId: string): Promise<any> {
    const response: AxiosResponse = await this.client.get(
      `/disha/admin/packages/${packageId}/report`
    );
    return response.data;
  }

  async downloadDishaPackageReportCsv(packageId: string): Promise<Blob> {
    const response: AxiosResponse<Blob> = await this.client.get(
      `/disha/admin/packages/${packageId}/report`,
      { params: { format: 'csv' }, responseType: 'blob' }
    );
    return response.data;
  }

  async getDishaIndividualStudentReport(
    packageId: string,
    attemptId: string
  ): Promise<any> {
    const response: AxiosResponse = await this.client.get(
      `/disha/admin/packages/${packageId}/attempts/${attemptId}/report`
    );
    return response.data;
  }

  async validateDishaToken(token: string): Promise<any> {
    const response: AxiosResponse = await this.client.post(
      `/disha/sso/validate-token`,
      null,
      { params: { token } }
    );
    return response.data;
  }

  // Mock test engine (Phase 2)
  async getMockTestLibrary(params?: Record<string, string>): Promise<any> {
    const response: AxiosResponse = await this.client.get('/mock-tests/library', { params });
    return response.data;
  }

  async getMockTestCompanies(): Promise<any> {
    const response: AxiosResponse = await this.client.get('/mock-tests/library/companies');
    return response.data;
  }

  async startMockTest(templateId: string): Promise<any> {
    const response: AxiosResponse = await this.client.post(`/mock-tests/${templateId}/start`);
    return response.data;
  }

  async getMockTestAttempt(attemptId: string): Promise<any> {
    const response: AxiosResponse = await this.client.get(`/mock-tests/attempts/${attemptId}`);
    return response.data;
  }

  async submitMockTestAttempt(attemptId: string, data: { answers: Record<string, string>; time_per_question?: Record<string, number>; time_taken_seconds?: number }): Promise<any> {
    const response: AxiosResponse = await this.client.post(`/mock-tests/attempts/${attemptId}/submit`, data);
    return response.data;
  }

  // Resume gap engine (Phase 3)
  async getResumeGapVersions(): Promise<{ versions: any[] }> {
    const response: AxiosResponse = await this.client.get('/students/resume-gaps/versions');
    return response.data;
  }

  async getResumeGapAnalyses(limit = 20): Promise<{ analyses: any[] }> {
    const response: AxiosResponse = await this.client.get('/students/resume-gaps/analyses', { params: { limit } });
    return response.data;
  }

  async getResumeGapAnalysis(analysisId: string): Promise<any> {
    const response: AxiosResponse = await this.client.get(`/students/resume-gaps/analyses/${analysisId}`);
    return response.data;
  }

  async analyzeResumeGaps(data: {
    job_description: string;
    job_title?: string;
    target_role?: string;
    resume_version_id?: string;
    match_method?: 'keyword' | 'embedding';
  }): Promise<any> {
    const response: AxiosResponse = await this.client.post('/students/resume-gaps/analyze', data);
    return response.data;
  }

  async adminListQuestionBank(params?: Record<string, string | number>): Promise<any> {
    const response: AxiosResponse = await this.client.get('/admin/cms/question-bank', { params });
    return response.data;
  }

  async adminCreateQuestion(data: any): Promise<any> {
    const response: AxiosResponse = await this.client.post('/admin/cms/question-bank', data);
    return response.data;
  }

  async adminGenerateAiQuestions(params: Record<string, string | number>): Promise<any> {
    const response: AxiosResponse = await this.client.post('/admin/cms/question-bank/generate-ai', null, { params });
    return response.data;
  }

  async adminListMockTests(): Promise<any> {
    const response: AxiosResponse = await this.client.get('/admin/cms/mock-tests');
    return response.data;
  }

  async adminCreateMockTest(data: any): Promise<any> {
    const response: AxiosResponse = await this.client.post('/admin/cms/mock-tests', data);
    return response.data;
  }

  async adminUpdateMockTest(templateId: string, data: any): Promise<any> {
    const response: AxiosResponse = await this.client.patch(`/admin/cms/mock-tests/${templateId}`, data);
    return response.data;
  }

  // Phase 4 — Placement drives & mock interviews
  async adminListPlacementDrives(): Promise<any[]> {
    const response: AxiosResponse = await this.client.get('/admin/cms/placement-drives');
    return response.data;
  }

  async adminCreatePlacementDrive(data: any): Promise<any> {
    const response: AxiosResponse = await this.client.post('/admin/cms/placement-drives', data);
    return response.data;
  }

  async adminUpdatePlacementDrive(id: string, data: any): Promise<any> {
    const response: AxiosResponse = await this.client.patch(`/admin/cms/placement-drives/${id}`, data);
    return response.data;
  }

  async adminListSimulationPipelines(): Promise<any[]> {
    const response: AxiosResponse = await this.client.get('/admin/cms/simulation-pipelines');
    return response.data;
  }

  async adminSeedSimulationPipelines(): Promise<any> {
    const response: AxiosResponse = await this.client.post('/admin/cms/simulation-pipelines/seed');
    return response.data;
  }

  async adminUpdateSimulationPipeline(id: string, data: any): Promise<any> {
    const response: AxiosResponse = await this.client.patch(`/admin/cms/simulation-pipelines/${id}`, data);
    return response.data;
  }

  async adminListJobRoleCatalog(): Promise<any[]> {
    const response: AxiosResponse = await this.client.get('/admin/cms/job-role-catalog');
    return response.data;
  }

  async adminListCompanyRolePreps(): Promise<any[]> {
    const response: AxiosResponse = await this.client.get('/admin/cms/company-role-preps');
    return response.data;
  }

  async adminCreateCompanyRolePrep(data: any): Promise<any> {
    const response: AxiosResponse = await this.client.post('/admin/cms/company-role-preps', data);
    return response.data;
  }

  async getSimulationJobRoles(): Promise<any[]> {
    const response: AxiosResponse = await this.client.get('/simulations/catalog/job-roles');
    return response.data;
  }

  async getSimulationCompanyPreps(company?: string): Promise<any[]> {
    const response: AxiosResponse = await this.client.get('/simulations/catalog/company-preps', {
      params: company ? { company } : undefined,
    });
    return response.data;
  }

  async previewSimulationEntry(params: {
    job_role_slug: string;
    company_role_prep_id?: string;
    company?: string;
  }): Promise<any> {
    const response: AxiosResponse = await this.client.get('/simulations/entry/preview', { params });
    return response.data;
  }

  async startSimulationRun(data: {
    job_role_slug: string;
    resume_version_id?: string;
    company_role_prep_id?: string;
    company?: string;
  }): Promise<any> {
    const response: AxiosResponse = await this.client.post('/simulations/runs/start', data);
    return response.data;
  }

  async getSimulationRun(runId: string): Promise<any> {
    const response: AxiosResponse = await this.client.get(`/simulations/runs/${runId}`);
    return response.data;
  }

  async startSimulationMcqStage(runId: string): Promise<any> {
    const response: AxiosResponse = await this.client.post(`/simulations/runs/${runId}/stages/mcq/start`);
    return response.data;
  }

  async completeSimulationStage(
    runId: string,
    data: { stage_index: number; score: number; metadata?: Record<string, unknown> }
  ): Promise<any> {
    const response: AxiosResponse = await this.client.post(`/simulations/runs/${runId}/complete-stage`, data);
    return response.data;
  }

  async listSimulationRuns(limit = 20): Promise<{ runs: any[] }> {
    const response: AxiosResponse = await this.client.get('/simulations/runs', { params: { limit } });
    return response.data;
  }

  async getPlacementDriveLibrary(): Promise<{ drives: any[] }> {
    const response: AxiosResponse = await this.client.get('/placement-drives/library');
    return response.data;
  }

  async startPlacementDrive(templateId: string): Promise<any> {
    const response: AxiosResponse = await this.client.post(`/placement-drives/${templateId}/start`);
    return response.data;
  }

  async getPlacementDriveAttempt(attemptId: string): Promise<any> {
    const response: AxiosResponse = await this.client.get(`/placement-drives/attempts/${attemptId}`);
    return response.data;
  }

  async completePlacementDriveStage(attemptId: string, data: {
    stage_index: number;
    score: number;
    metadata?: Record<string, unknown>;
  }): Promise<any> {
    const response: AxiosResponse = await this.client.post(
      `/placement-drives/attempts/${attemptId}/complete-stage`,
      data,
    );
    return response.data;
  }

  async getAssignedPlacementDrives(): Promise<{ assignments: any[] }> {
    const response: AxiosResponse = await this.client.get('/placement-drives/assigned');
    return response.data;
  }

  async getTpoCohortHeatmap(): Promise<any> {
    const response: AxiosResponse = await this.client.get('/college/tpo/cohort-heatmap');
    return response.data;
  }

  async getTpoAtRiskStudents(threshold = 55): Promise<any> {
    const response: AxiosResponse = await this.client.get('/college/tpo/at-risk', {
      params: { threshold },
    });
    return response.data;
  }

  async getTpoDriveAssignments(): Promise<{ assignments: any[] }> {
    const response: AxiosResponse = await this.client.get('/college/tpo/drive-assignments');
    return response.data;
  }

  async getTpoPublishedDrives(): Promise<{ drives: any[] }> {
    const response: AxiosResponse = await this.client.get('/college/tpo/published-drives');
    return response.data;
  }

  async bulkScheduleTpoDrives(data: {
    template_id: string;
    student_ids: string[];
    due_at?: string;
    notes?: string;
  }): Promise<any> {
    const response: AxiosResponse = await this.client.post('/college/tpo/bulk-schedule-drives', data);
    return response.data;
  }

  async downloadTpoCohortCsv(): Promise<Blob> {
    const response: AxiosResponse<Blob> = await this.client.get('/college/tpo/export/csv', {
      responseType: 'blob',
    });
    return response.data;
  }

  async getTpoCommitteeReportHtml(): Promise<string> {
    const response: AxiosResponse<string> = await this.client.get('/college/tpo/export/report', {
      responseType: 'text',
    });
    return response.data;
  }

  async startMockInterview(data: {
    persona: 'technical' | 'hr';
    target_role: string;
    company?: string;
    job_description?: string;
    max_turns?: number;
    audio_consent?: boolean;
    drive_attempt_id?: string;
    drive_stage_index?: number;
  }): Promise<any> {
    const response: AxiosResponse = await this.client.post('/mock-interviews/start', data);
    return response.data;
  }

  async submitMockInterviewTurn(sessionId: string, answer: string): Promise<any> {
    const response: AxiosResponse = await this.client.post(`/mock-interviews/${sessionId}/turn`, { answer });
    return response.data;
  }

  async completeMockInterview(sessionId: string, force = false): Promise<any> {
    const response: AxiosResponse = await this.client.post(`/mock-interviews/${sessionId}/complete`, { force });
    return response.data;
  }

  async getMockInterviewSession(sessionId: string): Promise<any> {
    const response: AxiosResponse = await this.client.get(`/mock-interviews/${sessionId}`);
    return response.data;
  }

  async getPaymentPlans(): Promise<{ plans: any[]; monetization_active: boolean }> {
    const response: AxiosResponse = await this.client.get('/payments/plans');
    return response.data;
  }

  async initiateCheckout(data: {
    plan_slug: string;
    coupon_code?: string;
    referral_code?: string;
  }): Promise<any> {
    const response: AxiosResponse = await this.client.post('/payments/checkout', data);
    return response.data;
  }

  async validatePaymentCoupon(code: string, planSlug: string): Promise<any> {
    const response: AxiosResponse = await this.client.post('/payments/validate-coupon', {
      code,
      plan_slug: planSlug,
    });
    return response.data;
  }

  async getMyPaymentTransactions(): Promise<{ transactions: any[] }> {
    const response: AxiosResponse = await this.client.get('/payments/my-transactions');
    return response.data;
  }

  async getMyReferralCode(): Promise<any> {
    const response: AxiosResponse = await this.client.get('/payments/referral');
    return response.data;
  }

  async adminCreatePaymentCoupon(data: {
    code: string;
    description?: string;
    discount_percent?: number;
    discount_amount_inr?: number;
    max_uses?: number;
    allowed_plan_slugs?: string[];
  }): Promise<any> {
    const response: AxiosResponse = await this.client.post('/payments/admin/coupons', data);
    return response.data;
  }

  async adminListEnterpriseOrgs(): Promise<{ organizations: any[] }> {
    const response: AxiosResponse = await this.client.get('/admin/enterprise/organizations');
    return response.data;
  }

  async adminCreateEnterpriseOrg(data: {
    organization_name: string;
    industry?: string;
    website?: string;
    admin_name: string;
    admin_email: string;
    admin_phone?: string;
    job_title?: string;
  }): Promise<any> {
    const response: AxiosResponse = await this.client.post('/admin/enterprise/organizations', data);
    return response.data;
  }

  async getEnterpriseDashboard(): Promise<any> {
    const response: AxiosResponse = await this.client.get('/enterprise/dashboard');
    return response.data;
  }

  async getEnterpriseCampaigns(): Promise<{ campaigns: any[] }> {
    const response: AxiosResponse = await this.client.get('/enterprise/campaigns');
    return response.data;
  }

  async createEnterpriseCampaign(data: {
    title: string;
    job_role: string;
    company?: string;
    mock_test_template_id: string;
    is_active?: boolean;
  }): Promise<any> {
    const response: AxiosResponse = await this.client.post('/enterprise/campaigns', data);
    return response.data;
  }

  async getEnterpriseCampaignResults(campaignId: string): Promise<any> {
    const response: AxiosResponse = await this.client.get(`/enterprise/campaigns/${campaignId}/results`);
    return response.data;
  }

  async createEnterpriseInvites(campaignId: string, data: {
    emails?: string[];
    names?: string[];
    expires_in_days?: number;
  }): Promise<any> {
    const response: AxiosResponse = await this.client.post(`/enterprise/campaigns/${campaignId}/invites`, data);
    return response.data;
  }

  async getEnterpriseMockTests(): Promise<{ mock_tests: any[] }> {
    const response: AxiosResponse = await this.client.get('/enterprise/mock-tests');
    return response.data;
  }

  async getEnterprisePublicInvite(token: string): Promise<any> {
    const response: AxiosResponse = await this.client.get(`/enterprise/public/invites/${token}`);
    return response.data;
  }

  async acceptEnterpriseInvite(token: string, data: { candidate_name: string; candidate_email: string }): Promise<any> {
    const response: AxiosResponse = await this.client.post(`/enterprise/public/invites/${token}/accept`, data);
    return response.data;
  }

  async startEnterpriseAssessment(token: string): Promise<any> {
    const response: AxiosResponse = await this.client.post(`/enterprise/public/invites/${token}/start`);
    return response.data;
  }

  async submitEnterpriseAssessment(token: string, data: {
    answers: Record<string, string>;
    time_per_question?: Record<string, number>;
    time_taken_seconds?: number;
  }): Promise<any> {
    const response: AxiosResponse = await this.client.post(`/enterprise/public/invites/${token}/submit`, data);
    return response.data;
  }
}

export const apiClient = new ApiClient();
export const api = apiClient; // Export as 'api' for cleaner imports
export default apiClient;

// ============================================================================
// STANDALONE EXPORT FUNCTIONS FOR CONVENIENCE
// ============================================================================

// Phase 1: Student Subscription Analytics
export const getStudentSubscriptionStatus = () => apiClient.getStudentSubscriptionStatus();
export const getStudentUsageAnalytics = () => apiClient.getStudentUsageAnalytics();

// Phase 2: College Subscription Analytics
export const getCollegeLicenseOverview = () => apiClient.getCollegeLicenseOverview();
export const getStudentSubscriptionDistribution = () => apiClient.getStudentSubscriptionDistribution();
export const getUsageAnalyticsBySubscription = () => apiClient.getUsageAnalyticsBySubscription();
export const getSubscriptionHealth = () => apiClient.getSubscriptionHealth();
// Phase 3: Admin Subscription & Business Analytics
export const getAdminSubscriptionOverview = () => apiClient.getAdminSubscriptionOverview();
export const getAdminCollegeLicenses = () => apiClient.getAdminCollegeLicenses();
export const getAdminSubscriptionTrends = () => apiClient.getAdminSubscriptionTrends();
export const getAdminRevenueMetrics = () => apiClient.getAdminRevenueMetrics();