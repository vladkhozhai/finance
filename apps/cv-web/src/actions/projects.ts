/**
 * Projects Server Actions
 *
 * Handles project operations (get, create, update, delete, reorder).
 * Projects are ordered by display_order for user-controlled sorting.
 */

"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { projectSchema, type ProjectInput } from "@/lib/validations/profile";

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export interface Project {
  id: string;
  user_id: string;
  project_name: string;
  role: string | null;
  start_date: string | null;
  end_date: string | null;
  is_ongoing: boolean | null;
  description: string | null;
  technologies: string[] | null;
  project_url: string | null;
  display_order: number | null;
  created_at: string;
  updated_at: string;
}

/**
 * Get current user's projects ordered by display_order, then start_date desc
 */
export async function getProjects(): Promise<ActionResult<Project[]>> {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "Unauthorized" };
    }

    // Fetch projects
    const { data: projects, error: fetchError } = await supabase
      .from("cv_projects")
      .select("*")
      .eq("user_id", user.id)
      .order("display_order", { ascending: true })
      .order("start_date", { ascending: false });

    if (fetchError) {
      console.error("Projects fetch error:", fetchError);
      return { success: false, error: "Failed to fetch projects" };
    }

    return { success: true, data: projects || [] };
  } catch (error) {
    console.error("Unexpected error in getProjects:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Create new project for current user
 */
export async function createProject(
  data: ProjectInput,
): Promise<ActionResult<{ id: string }>> {
  try {
    // Validate input
    const validated = projectSchema.safeParse(data);
    if (!validated.success) {
      return {
        success: false,
        error: validated.error.issues[0]?.message || "Invalid input",
      };
    }

    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "Unauthorized" };
    }

    // Validate business rules
    if (validated.data.is_ongoing && validated.data.end_date) {
      return {
        success: false,
        error: "Ongoing project cannot have an end date",
      };
    }

    // Get current max display_order
    const { data: existingProjects, error: fetchError } = await supabase
      .from("cv_projects")
      .select("display_order")
      .eq("user_id", user.id)
      .order("display_order", { ascending: false })
      .limit(1);

    if (fetchError) {
      console.error("Error fetching existing projects:", fetchError);
      return { success: false, error: "Failed to create project" };
    }

    const nextOrder =
      existingProjects && existingProjects.length > 0 && existingProjects[0].display_order !== null
        ? existingProjects[0].display_order + 1
        : 0;

    // Normalize empty strings to null for URLs
    const projectUrl = validated.data.project_url === "" ? null : validated.data.project_url;

    // Create project
    const { data: project, error: insertError } = await supabase
      .from("cv_projects")
      .insert({
        user_id: user.id,
        project_name: validated.data.project_name,
        role: validated.data.role,
        start_date: validated.data.start_date,
        end_date: validated.data.end_date,
        is_ongoing: validated.data.is_ongoing,
        description: validated.data.description,
        technologies: validated.data.technologies,
        project_url: projectUrl,
        display_order: nextOrder,
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("Project insert error:", insertError);
      return { success: false, error: "Failed to create project" };
    }

    // Revalidate relevant paths
    revalidatePath("/dashboard");
    revalidatePath("/profile");
    revalidatePath("/cv");

    return { success: true, data: { id: project.id } };
  } catch (error) {
    console.error("Unexpected error in createProject:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Update existing project
 */
export async function updateProject(
  id: string,
  data: ProjectInput,
): Promise<ActionResult<{ id: string }>> {
  try {
    // Validate ID
    if (!id) {
      return { success: false, error: "Project ID is required" };
    }

    // Validate input
    const validated = projectSchema.safeParse(data);
    if (!validated.success) {
      return {
        success: false,
        error: validated.error.issues[0]?.message || "Invalid input",
      };
    }

    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "Unauthorized" };
    }

    // Validate business rules
    if (validated.data.is_ongoing && validated.data.end_date) {
      return {
        success: false,
        error: "Ongoing project cannot have an end date",
      };
    }

    // Normalize empty strings to null for URLs
    const projectUrl = validated.data.project_url === "" ? null : validated.data.project_url;

    // Update project (RLS ensures user can only update their own projects)
    const { error: updateError } = await supabase
      .from("cv_projects")
      .update({
        project_name: validated.data.project_name,
        role: validated.data.role,
        start_date: validated.data.start_date,
        end_date: validated.data.end_date,
        is_ongoing: validated.data.is_ongoing,
        description: validated.data.description,
        technologies: validated.data.technologies,
        project_url: projectUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("user_id", user.id);

    if (updateError) {
      console.error("Project update error:", updateError);
      return { success: false, error: "Failed to update project" };
    }

    // Revalidate relevant paths
    revalidatePath("/dashboard");
    revalidatePath("/profile");
    revalidatePath("/cv");

    return { success: true, data: { id } };
  } catch (error) {
    console.error("Unexpected error in updateProject:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Delete project
 */
export async function deleteProject(
  id: string,
): Promise<ActionResult<{ success: true }>> {
  try {
    // Validate ID
    if (!id) {
      return { success: false, error: "Project ID is required" };
    }

    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "Unauthorized" };
    }

    // Delete project (RLS ensures user can only delete their own projects)
    const { error: deleteError } = await supabase
      .from("cv_projects")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (deleteError) {
      console.error("Project delete error:", deleteError);
      return { success: false, error: "Failed to delete project" };
    }

    // Revalidate relevant paths
    revalidatePath("/dashboard");
    revalidatePath("/profile");
    revalidatePath("/cv");

    return { success: true, data: { success: true } };
  } catch (error) {
    console.error("Unexpected error in deleteProject:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Reorder projects by updating display_order
 * @param orderedIds - Array of project IDs in the desired order
 */
export async function reorderProjects(
  orderedIds: string[],
): Promise<ActionResult<{ success: true }>> {
  try {
    // Validate input
    if (!orderedIds || orderedIds.length === 0) {
      return { success: false, error: "No projects to reorder" };
    }

    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "Unauthorized" };
    }

    // Verify all IDs belong to the user
    const { data: existingProjects, error: fetchError } = await supabase
      .from("cv_projects")
      .select("id")
      .eq("user_id", user.id)
      .in("id", orderedIds);

    if (fetchError) {
      console.error("Error fetching projects for reorder:", fetchError);
      return { success: false, error: "Failed to reorder projects" };
    }

    if (existingProjects.length !== orderedIds.length) {
      return {
        success: false,
        error: "Some projects do not exist or do not belong to you",
      };
    }

    // Update display_order for each project
    const updates = orderedIds.map((id, index) => {
      return supabase
        .from("cv_projects")
        .update({ display_order: index, updated_at: new Date().toISOString() })
        .eq("id", id)
        .eq("user_id", user.id);
    });

    // Execute all updates in parallel
    const results = await Promise.all(updates);

    // Check for any errors
    const errors = results.filter((result) => result.error);
    if (errors.length > 0) {
      console.error("Project reorder errors:", errors);
      return { success: false, error: "Failed to reorder projects" };
    }

    // Revalidate relevant paths
    revalidatePath("/dashboard");
    revalidatePath("/profile");
    revalidatePath("/cv");

    return { success: true, data: { success: true } };
  } catch (error) {
    console.error("Unexpected error in reorderProjects:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}
