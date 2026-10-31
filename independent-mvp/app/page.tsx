import { currentUser } from "@/lib/session";
import { db } from "@/lib/db";

export default async function Home() {
  let user = null; let records: Array<{id:string;title:string;details:string;created_at:string}> = []; let error = "";
  try {
    user = await currentUser();
    if (user) {
      const result = await db().query(
        "SELECT id,title,details,created_at FROM hse_records WHERE company_id=$1 ORDER BY created_at DESC LIMIT 20",
        [user.company_id]
      );
      records = result.rows;
    }
  } catch (e) { error = e instanceof Error ? e.message : "Configuration required"; }
  return <main style={{maxWidth:1000,margin:"48px auto",padding:24}}>
    <header style={{background:"#102a43",color:"white",padding:28,borderRadius:16}}>
      <div style={{fontSize:12,letterSpacing:3}}>INDEPENDENT WORKSPACE</div>
      <h1 style={{fontSize:34,margin:"12px 0"}}>AMNKO HSE</h1>
      <p style={{opacity:.8}}>Health, Safety & Environment control center</p>
    </header>
    {error && <p style={{background:"#fff3cd",padding:16,borderRadius:8}}>Setup required: {error}</p>}
    {!user ? <section style={{background:"white",padding:24,marginTop:20,borderRadius:12}}>
      <h2>Independent MVP is prepared</h2><p>Configure a dedicated Neon database and apply db/schema.sql and db/session-table.sql before enabling sign-in.</p>
      <a href="/login">Sign in</a>
    </section> : <section style={{marginTop:20,background:"white",padding:24,borderRadius:12}}>
      <h2>Welcome, {user.display_name}</h2><p>Company workspace: {user.company_id}</p><h3>HSE records</h3>
      {records.length ? records.map(r=><article key={r.id} style={{padding:12,borderBottom:"1px solid #ddd"}}><b>{r.title}</b><p>{r.details}</p></article>) : <p>No records yet.</p>}
      <form action="/api/records" method="post" style={{display:"grid",gap:8,maxWidth:500}}>
        <input name="title" placeholder="Record title" required style={{padding:12}}/><textarea name="details" placeholder="Details" style={{padding:12}}/><button style={{padding:12}}>Create HSE record</button>
      </form>
      <form action="/api/logout" method="post"><button style={{marginTop:12,padding:10}}>Sign out</button></form>
    </section>}
  </main>;
}
