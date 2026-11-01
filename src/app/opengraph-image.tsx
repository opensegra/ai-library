import { ImageResponse } from 'next/og';

export const alt = 'AI Library: pose, costume and 3D reference studio';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '72px 84px',
          background: '#171717',
          color: '#f5f0e8',
          fontFamily: 'Arial, sans-serif',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div style={{ position: 'absolute', right: -105, top: -220, width: 650, height: 650, border: '1px solid #393633', borderRadius: 999 }} />
        <div style={{ position: 'absolute', right: -15, top: -130, width: 470, height: 470, border: '1px solid #393633', borderRadius: 999 }} />
        <div style={{ display: 'flex', flexDirection: 'column', width: 690, zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 68 }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: '#f28a62', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#171717', fontSize: 28, fontWeight: 700 }}>A</div>
            <span style={{ fontSize: 22, letterSpacing: 2.5, color: '#c7c1b8', textTransform: 'uppercase' }}>AI Library</span>
          </div>
          <div style={{ fontSize: 68, lineHeight: 1.04, fontWeight: 700, letterSpacing: -3 }}>References for</div>
          <div style={{ fontSize: 68, lineHeight: 1.04, fontWeight: 700, letterSpacing: -3, color: '#f28a62' }}>better imagery.</div>
          <div style={{ marginTop: 28, fontSize: 24, lineHeight: 1.5, color: '#c7c1b8' }}>Poses · costumes · a rigged 3D mannequin</div>
          <div style={{ marginTop: 48, display: 'flex', gap: 12 }}>
            {['288 poses', '1,407 costumes', '3D pose rig'].map((label) => (
              <div key={label} style={{ border: '1px solid #49443f', borderRadius: 99, padding: '10px 17px', fontSize: 16, color: '#ddd5ca' }}>{label}</div>
            ))}
          </div>
        </div>
        <div style={{ width: 260, height: 360, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>
          <svg width="240" height="340" viewBox="0 0 240 340" fill="none">
            <path d="M128 44c-16 0-28 11-28 26 0 12 8 21 20 24l31 8c19 5 31 18 31 38 0 27-22 46-54 46-27 0-49-13-60-35" stroke="#F5F0E8" strokeWidth="7" strokeLinecap="round" />
            <circle cx="132" cy="40" r="15" fill="#F28A62" />
            <circle cx="61" cy="159" r="11" fill="#B9A5FF" />
            <path d="m123 111-32 27m32-27 40 19m-40-19 5 49m-5-49-32-19m32 68-32 42m32-42 40 31" stroke="#F5F0E8" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="91" cy="92" r="8" fill="#F28A62" /><circle cx="163" cy="130" r="8" fill="#B9A5FF" />
            <circle cx="128" cy="160" r="8" fill="#F28A62" /><circle cx="91" cy="221" r="8" fill="#B9A5FF" />
            <circle cx="163" cy="210" r="8" fill="#F28A62" />
          </svg>
        </div>
      </div>
    ),
    { ...size }
  );
}
