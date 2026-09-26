/* ===== WEBZ SITES STORE (Supabase-backed) =====
   This is the ONLY place that knows how website data is stored.
   Everything here is now real: reads/writes go to your Supabase
   "websites" table, protected by the Row Level Security policies
   from setup.sql. All functions are async now -- callers must
   use await.
*/

const WebzSites = (() => {
  const sb = window.WebzSupabase;

  // Selects the website columns plus the creator's username
  // via the foreign-key relationship to profiles.
  const SITE_SELECT = "*, profiles(username)";

  function normalize(row) {
    if (!row) return null;
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      html: row.html_content,
      published: row.published,
      createdAt: row.created_at,
      creator: row.profiles ? row.profiles.username : "unknown",
      creatorId: row.creator_id,
    };
  }

  async function getAllPublished() {
    const { data, error } = await sb
      .from("websites")
      .select(SITE_SELECT)
      .eq("published", true)
      .order("created_at", { ascending: false });
    if (error) {
      console.error("getAllPublished error:", error);
      return [];
    }
    return data.map(normalize);
  }

  async function getById(id) {
    const { data, error } = await sb
      .from("websites")
      .select(SITE_SELECT)
      .eq("id", id)
      .single();
    if (error) {
      console.error("getById error:", error);
      return null;
    }
    return normalize(data);
  }

  async function search(query) {
    const q = query.trim();
    if (!q) return [];

    // Match 1: name or description contains the query
    const { data: directMatches, error: directError } = await sb
      .from("websites")
      .select(SITE_SELECT)
      .eq("published", true)
      .or(`name.ilike.%${q}%,description.ilike.%${q}%`);
    if (directError) console.error("search (direct) error:", directError);

    // Match 2: creator's username contains the query
    const { data: matchingProfiles, error: profileError } = await sb
      .from("profiles")
      .select("id")
      .ilike("username", `%${q}%`);
    if (profileError) console.error("search (profiles) error:", profileError);

    let byCreator = [];
    if (matchingProfiles && matchingProfiles.length > 0) {
      const ids = matchingProfiles.map((p) => p.id);
      const { data, error } = await sb
        .from("websites")
        .select(SITE_SELECT)
        .eq("published", true)
        .in("creator_id", ids);
      if (error) console.error("search (byCreator) error:", error);
      byCreator = data || [];
    }

    // Merge and de-duplicate
    const merged = [...(directMatches || []), ...byCreator];
    const seen = new Set();
    const deduped = merged.filter((row) => {
      if (seen.has(row.id)) return false;
      seen.add(row.id);
      return true;
    });

    return deduped.map(normalize);
  }

  async function addSite({ name, description, html, published }) {
    const user = WebzAuth.getCurrentUser();
    if (!user) return { error: "You must be logged in to publish a website." };

    const { data, error } = await sb
      .from("websites")
      .insert({
        name,
        description,
        html_content: html,
        published: published !== false,
        creator_id: user.id,
      })
      .select(SITE_SELECT)
      .single();

    if (error) return { error: error.message };
    return { site: normalize(data) };
  }

  async function updateSite(id, updates) {
    const dbUpdates = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.html !== undefined) dbUpdates.html_content = updates.html;
    if (updates.published !== undefined) dbUpdates.published = updates.published;

    const { error } = await sb.from("websites").update(dbUpdates).eq("id", id);
    if (error) return { error: error.message };
    return { success: true };
  }

  async function getMySites() {
    const user = WebzAuth.getCurrentUser();
    if (!user) return [];
    const { data, error } = await sb
      .from("websites")
      .select(SITE_SELECT)
      .eq("creator_id", user.id)
      .order("created_at", { ascending: false });
    if (error) {
      console.error("getMySites error:", error);
      return [];
    }
    return data.map(normalize);
  }

  return { getAllPublished, getById, search, addSite, updateSite, getMySites };
})();
