import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@4.0.0";

type LeadType = "booking" | "newsletter";

type LeadRequest = {
  type: LeadType;
  source?: string;
  payload?: Record<string, string>;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

const json = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json"
    }
  });

const requireEnv = (name: string) => {
  const value = Deno.env.get(name);
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json(405, { error: "Method not allowed" });
  }

  try {
    const supabaseUrl = requireEnv("PROJECT_URL");
    const serviceRoleKey = requireEnv("SERVICE_ROLE_KEY");
    const resendApiKey = requireEnv("RESEND_API_KEY");
    const notifyTo = requireEnv("LEAD_NOTIFY_TO");
    const fromEmail = Deno.env.get("LEAD_FROM_EMAIL") || "Chinatraveldeal <onboarding@resend.dev>";

    const body = (await req.json()) as LeadRequest;
    const type = body?.type;
    const payload = body?.payload || {};
    const source = body?.source || "website";

    if (type !== "booking" && type !== "newsletter") {
      return json(400, { error: "Invalid type. Expected booking or newsletter." });
    }

    if (type === "booking") {
      const required = ["name", "email", "date", "travelers", "destination", "interest"];
      const missing = required.find((key) => !payload[key]);
      if (missing) {
        return json(400, { error: `Missing field: ${missing}` });
      }
    }

    if (type === "newsletter" && !payload.email) {
      return json(400, { error: "Missing field: email" });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const resend = new Resend(resendApiKey);

    const leadRow = {
      request_type: type,
      source,
      full_name: payload.name || payload.firstName || null,
      email: payload.email || null,
      travel_date: payload.date || null,
      travelers: payload.travelers || null,
      destination: payload.destination || null,
      interest: payload.interest || null,
      note: payload.message || payload.notes || null,
      raw_payload: payload
    };

    const { error: insertError } = await supabase.from("lead_requests").insert(leadRow);
    if (insertError) {
      console.error("Insert failed:", insertError);
      return json(500, { error: "Database insert failed" });
    }

    const internalSubject =
      type === "booking"
        ? `New booking lead: ${leadRow.full_name || "Unknown"}`
        : `New newsletter signup: ${leadRow.email || "Unknown"}`;

    const internalHtml = `
      <h2>New ${type} lead</h2>
      <p><strong>Source:</strong> ${source}</p>
      <pre>${JSON.stringify(payload, null, 2)}</pre>
    `;

    await resend.emails.send({
      from: fromEmail,
      to: [notifyTo],
      subject: internalSubject,
      html: internalHtml
    });

    if (type === "booking" && leadRow.email) {
      await resend.emails.send({
        from: fromEmail,
        to: [leadRow.email],
        subject: "Chinatraveldeal: We received your trip request",
        html: `
          <p>Hi ${leadRow.full_name || "traveler"},</p>
          <p>Thanks for your request. Our team will email your custom itinerary within 24 hours.</p>
          <p>- Chinatraveldeal</p>
        `
      });
    }

    if (type === "newsletter" && leadRow.email) {
      await resend.emails.send({
        from: fromEmail,
        to: [leadRow.email],
        subject: "Chinatraveldeal: Subscription confirmed",
        html: `
          <p>Thanks for subscribing to Chinatraveldeal.</p>
          <p>We'll send you new U.S.-to-China deal alerts soon.</p>
        `
      });
    }

    return json(200, { ok: true });
  } catch (error) {
    console.error(error);
    return json(500, { error: "Unexpected server error" });
  }
});
