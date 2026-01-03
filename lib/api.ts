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
    // Validate API base URL
    if (!config.api.fullUrl) {
      console.error("⚠️ API Base URL is not configured. Please set NEXT_PUBLIC_API_BASE_URL environment variable.");
    }

    this.client = axios.create({
      baseURL: config.api.fullUrl,
      timeout: 180000, // 180 seconds timeout (3 minutes) for web scraping operations
      headers: {
        "Content-Type": "application/json",
      },
    });

    console.log("🚀 API Client initialized:", {
      baseURL: config.api.fullUrl || "(not configured)",
      timeout: "180s (3 minutes)",
    });

    // Add request interceptor to include auth token
    this.client.interceptors.request.use(
      async (config: CustomAxiosRequestConfig) => {
        // Add API version prefix
        if (!config.url?.startsWith("/api/v1/")) {
          config.url = `/api/v1${config.url}`;
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
    limit?: number;
    offset?: number;
  }): Promise<any> {
    const response: AxiosResponse = await this.client.get(
      `/disha/admin/packages`,
      { params }
    );
    return response.data;
  }
}

export const apiClient = new ApiClient();
export const api = apiClient; // Export as 'api' for cleaner imports
export default apiClient;
