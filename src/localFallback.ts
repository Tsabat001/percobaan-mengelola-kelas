import { getKaldikJabarEvents, KALDIK_JABAR_REF } from './data/kaldikJabar';

const STORAGE_KEY = 'mk_local_db_v1';
const SESSION_KEY = 'mk_local_sessions_v1';

interface LocalDb {
  admin: { user: string; passHash: string } | null;
  sheets: Record<string, Record<string, string>[]>;
}

interface LocalSession {
  role: 'admin' | 'staf' | 'siswa';
  sid: string;
  nama: string;
  expires: number;
}

const PENGATURAN_AWAL: Record<string, string> = {
  sekolah: 'SMA Negeri 1 Nusantara',
  logo: '',
  jurusan: 'MIPA, IPS, Bahasa',
  jurusanLogos: '{}',
  waInfo: '6281234567890',
  emailPemulihan: 'robisaiful@gmail.com',
  kodeReset: 'NUSANTARA2026',
  guru: 'Dra. Ratna Sari, M.Pd.',
  wali: 'Dra. Ratna Sari, M.Pd.',
  semester: 'Ganjil 2026/2027',
  mulai: '2026-07-15',
  kkm: '75',
  b_sikap: '10',
  b_tugas: '20',
  b_proyek: '20',
  b_uts: '20',
  b_uas: '30',
  kaldikAutoSync: '1',
  kaldikWilayah: KALDIK_JABAR_REF.wilayah,
  kaldikTahunAjaran: KALDIK_JABAR_REF.tahunAjaran,
  kaldikLastSync: '2026-07-15'
};

async function sha256Base64(salt: string, teks: string): Promise<string> {
  const bytes = new TextEncoder().encode(salt + '|' + teks);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  const arr = Array.from(new Uint8Array(digest));
  let bin = '';
  for (let i = 0; i < arr.length; i++) bin += String.fromCharCode(arr[i]);
  return btoa(bin);
}

function uidShort(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function fmtYmd(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

async function createSeedLocalDb(): Promise<LocalDb> {
  const today = new Date();
  const d0 = fmtYmd(today);
  const d1 = fmtYmd(new Date(today.getTime() - 86400000));
  const d2 = fmtYmd(new Date(today.getTime() - 2 * 86400000));
  const d3 = fmtYmd(new Date(today.getTime() - 3 * 86400000));

  const mapelList = [
    { ID: 'mp1', Nama: 'Matematika' },
    { ID: 'mp2', Nama: 'Bahasa Indonesia' },
    { ID: 'mp3', Nama: 'Bahasa Inggris' },
    { ID: 'mp4', Nama: 'Fisika' },
    { ID: 'mp5', Nama: 'Kimia' },
    { ID: 'mp6', Nama: 'Biologi' },
    { ID: 'mp7', Nama: 'Sejarah Indonesia' },
    { ID: 'mp8', Nama: 'Informatika' },
    { ID: 'mp9', Nama: 'PJOK' },
    { ID: 'mp10', Nama: 'Pendidikan Pancasila' }
  ];

  const kelasList = [
    { ID: 'kls_10a', Nama: 'X MIPA 1', Jurusan: 'MIPA', Mapel: '' },
    { ID: 'kls_10b', Nama: 'X MIPA 2', Jurusan: 'MIPA', Mapel: '' },
    { ID: 'kls_11a', Nama: 'XI MIPA 1', Jurusan: 'MIPA', Mapel: '' }
  ];

  const penggunaList = [
    {
      ID: 'usr_wali1',
      Nama: 'Dra. Ratna Sari, M.Pd.',
      Username: 'ratna',
      Peran: 'wali,guru',
      Kelas: 'kls_10a,kls_10b',
      Hash: await sha256Base64('usr_wali1', 'guru12345'),
      Mapel: 'mp1',
      KelasWali: 'kls_10a',
      KelasMengajar: 'kls_10a,kls_10b'
    },
    {
      ID: 'usr_guru1',
      Nama: 'Budi Santoso, S.Kom.',
      Username: 'budi',
      Peran: 'wali,guru',
      Kelas: 'kls_11a,kls_10a',
      Hash: await sha256Base64('usr_guru1', 'guru12345'),
      Mapel: 'mp8,mp4',
      KelasWali: 'kls_11a',
      KelasMengajar: 'kls_10a,kls_11a'
    }
  ];

  const siswaList = [
    { ID: 'sis_01', Kelas: 'kls_10a', Nama: 'Adinda Putri Maharani', NIS: '102601', NoSiswa: '081234567801', NoOrtu: '081398765001', Alamat: 'Jl. Merdeka No. 12', Kesehatan: 'Normal' },
    { ID: 'sis_02', Kelas: 'kls_10a', Nama: 'Bagas Pratama Wijaya', NIS: '102602', NoSiswa: '081234567802', NoOrtu: '081398765002', Alamat: 'Jl. Sudirman No. 45', Kesehatan: 'Alergi debu' },
    { ID: 'sis_03', Kelas: 'kls_10a', Nama: 'Citra Kirana Lestari', NIS: '102603', NoSiswa: '081234567803', NoOrtu: '081398765003', Alamat: 'Jl. Diponegoro No. 8', Kesehatan: 'Normal' },
    { ID: 'sis_04', Kelas: 'kls_10a', Nama: 'Dimas Aditya Saputra', NIS: '102604', NoSiswa: '081234567804', NoOrtu: '081398765004', Alamat: 'Jl. Gatot Subroto No. 19', Kesehatan: 'Minus mata (-1.5)' },
    { ID: 'sis_05', Kelas: 'kls_10a', Nama: 'Eka Fitriani Rahmawati', NIS: '102605', NoSiswa: '081234567805', NoOrtu: '081398765005', Alamat: 'Jl. Ahmad Yani No. 33', Kesehatan: 'Normal' },
    { ID: 'sis_06', Kelas: 'kls_10a', Nama: 'Fajar Nugroho Hidayat', NIS: '102606', NoSiswa: '081234567806', NoOrtu: '081398765006', Alamat: 'Jl. Kartini No. 7', Kesehatan: 'Asma ringan' },
    { ID: 'sis_07', Kelas: 'kls_10a', Nama: 'Gita Nadia Permata', NIS: '102607', NoSiswa: '081234567807', NoOrtu: '081398765007', Alamat: 'Jl. Imam Bonjol No. 21', Kesehatan: 'Normal' },
    { ID: 'sis_08', Kelas: 'kls_10a', Nama: 'Hafiz Ramadhan Putra', NIS: '102608', NoSiswa: '081234567808', NoOrtu: '081398765008', Alamat: 'Jl. Pahlawan No. 54', Kesehatan: 'Normal' },
    { ID: 'sis_09', Kelas: 'kls_10a', Nama: 'Indah Kusuma Wardani', NIS: '102609', NoSiswa: '081234567809', NoOrtu: '081398765009', Alamat: 'Jl. Veteran No. 14', Kesehatan: 'Normal' },
    { ID: 'sis_10', Kelas: 'kls_10a', Nama: 'Joko Susilo Wibowo', NIS: '102610', NoSiswa: '081234567810', NoOrtu: '081398765010', Alamat: 'Jl. Pemuda No. 28', Kesehatan: 'Normal' },
    { ID: 'sis_11', Kelas: 'kls_10a', Nama: 'Kartika Sari Dewi', NIS: '102611', NoSiswa: '081234567811', NoOrtu: '081398765011', Alamat: 'Jl. Cendrawasih No. 9', Kesehatan: 'Normal' },
    { ID: 'sis_12', Kelas: 'kls_10a', Nama: 'Luthfi Hakim Maulana', NIS: '102612', NoSiswa: '081234567812', NoOrtu: '081398765012', Alamat: 'Jl. Melati No. 3', Kesehatan: 'Normal' },
    { ID: 'sis_13', Kelas: 'kls_10b', Nama: 'Muhammad Rizky Pratama', NIS: '102613', NoSiswa: '081234567813', NoOrtu: '081398765013', Alamat: 'Jl. Kenanga No. 11', Kesehatan: 'Normal' },
    { ID: 'sis_14', Kelas: 'kls_10b', Nama: 'Nabila Azzahra Putri', NIS: '102614', NoSiswa: '081234567814', NoOrtu: '081398765014', Alamat: 'Jl. Anggrek No. 20', Kesehatan: 'Normal' },
    { ID: 'sis_15', Kelas: 'kls_11a', Nama: 'Raka Danuarta', NIS: '112601', NoSiswa: '081234567815', NoOrtu: '081398765015', Alamat: 'Jl. Mawar No. 5', Kesehatan: 'Normal' }
  ];

  const akunList = await Promise.all(
    siswaList.map(async s => ({ SiswaID: s.ID, Hash: await sha256Base64(s.ID, '123456') }))
  );

  const kls10A = siswaList.filter(s => s.Kelas === 'kls_10a');
  const absensiList: Record<string, string>[] = [];
  [d3, d2, d1, d0].forEach((tgl, idx) => {
    kls10A.forEach((s, sIdx) => {
      let kode = 'H';
      let ket = '';
      if (idx === 1 && sIdx === 3) { kode = 'S'; ket = 'Demam (surat orang tua)'; }
      if (idx === 2 && sIdx === 5) { kode = 'I'; ket = 'Acara keluarga'; }
      if (idx === 2 && sIdx === 9) { kode = 'A'; ket = 'Tanpa keterangan'; }
      if (idx === 3 && sIdx === 1) { kode = 'T'; ket = 'Hadir 07:12 karena ban bocor'; }
      if (idx === 3 && sIdx === 9) { kode = 'A'; ket = 'Belum konfirmasi'; }
      absensiList.push({ Kelas: 'kls_10a', Tanggal: tgl, SiswaID: s.ID, Kode: kode, Keterangan: ket, Sumber: '' });
    });
  });

  const tugasList = [
    { ID: 'tug_1', Kelas: 'kls_10a', Judul: 'Latihan Eksponen & Logaritma', Mapel: 'Matematika', Deskripsi: 'Kerjakan soal latihan nomor 1-10 lengkap dengan langkah penyelesaian.', Tenggat: d2, Jenis: 'Tugas', FileID: '', NamaFile: '' },
    { ID: 'tug_2', Kelas: 'kls_10a', Judul: 'Kuis Sistem Persamaan Linear', Mapel: 'Matematika', Deskripsi: 'Selesaikan persamaan linear 3 variabel dan unggah hasil kerja.', Tenggat: d1, Jenis: 'Kuis harian', FileID: '', NamaFile: '' },
    { ID: 'tug_3', Kelas: 'kls_10a', Judul: 'Proyek Pemodelan Fungsi Kuadrat', Mapel: 'Matematika', Deskripsi: 'Buat laporan pemodelan parabola dalam kehidupan sehari-hari.', Tenggat: fmtYmd(new Date(today.getTime() + 5 * 86400000)), Jenis: 'Proyek', FileID: '', NamaFile: '' }
  ];

  const pengumpulanList: Record<string, string>[] = [];
  const nilaiList: Record<string, string>[] = [];
  kls10A.forEach((s, i) => {
    const n1 = String(82 + ((i * 3) % 16));
    const n2 = String(78 + ((i * 5) % 20));
    const nProyek = String(84 + ((i * 2) % 14));
    const nUTS = String(76 + ((i * 4) % 22));
    const nUAS = String(80 + ((i * 3) % 18));
    pengumpulanList.push(
      { TugasID: 'tug_1', SiswaID: s.ID, Status: i === 9 ? 'Terlambat' : 'Tepat Waktu', Nilai: n1, FileID: '', NamaFile: '', TanggalKumpul: d2, CatatanSiswa: '' },
      { TugasID: 'tug_2', SiswaID: s.ID, Status: i === 5 ? 'Terlambat' : 'Tepat Waktu', Nilai: n2, FileID: '', NamaFile: '', TanggalKumpul: d1, CatatanSiswa: '' },
      { TugasID: 'tug_3', SiswaID: s.ID, Status: i < 8 ? 'Tepat Waktu' : 'Belum', Nilai: i < 8 ? nProyek : '', FileID: '', NamaFile: '', TanggalKumpul: i < 8 ? d1 : '', CatatanSiswa: '' }
    );
    nilaiList.push({
      Kelas: 'kls_10a',
      SiswaID: s.ID,
      Sikap: i === 9 ? '80' : '95',
      Tugas: String(Math.round((Number(n1) + Number(n2)) / 2)),
      Proyek: nProyek,
      UTS: i === 9 ? '68' : nUTS,
      UAS: i === 9 ? '70' : nUAS
    });
  });

  const hariPiket = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];
  const tugasPiket = ['Menyapu lantai', 'Mengepel', 'Menghapus papan tulis', 'Merapikan meja & kursi', 'Membuang sampah'];

  return {
    admin: {
      user: 'admin',
      passHash: await sha256Base64('local-admin', 'admin12345')
    },
    sheets: {
      Pengaturan: Object.entries(PENGATURAN_AWAL).map(([Kunci, Nilai]) => ({ Kunci, Nilai })),
      Kelas: kelasList,
      Siswa: siswaList,
      Absensi: absensiList,
      Tugas: tugasList,
      Pengumpulan: pengumpulanList,
      Nilai: nilaiList,
      Perilaku: [
        { ID: 'per_1', Kelas: 'kls_10a', Tanggal: d2, SiswaID: 'sis_01', Jenis: 'Penguatan positif', Level: '', Catatan: 'Memimpin diskusi kelompok dan membantu teman memahami materi logaritma', TindakLanjut: 'Apresiasi di depan kelas' },
        { ID: 'per_2', Kelas: 'kls_10a', Tanggal: d1, SiswaID: 'sis_03', Jenis: 'Penguatan positif', Level: '', Catatan: 'Menyiapkan perangkat proyektor dan kebersihan kelas sebelum jam pertama', TindakLanjut: 'Pesan apresiasi ke orang tua' },
        { ID: 'per_3', Kelas: 'kls_10a', Tanggal: d1, SiswaID: 'sis_10', Jenis: 'Pelanggaran', Level: '1', Catatan: 'Kurang fokus saat penjelasan materi inti', TindakLanjut: 'Pengingat lisan' }
      ],
      Checklist: [0, 1, 2, 3, 4, 5].map(i => ({ Kelas: 'kls_10a', Item: String(i), Selesai: '1' })),
      DenahAtur: [{ Kelas: 'kls_10a', Baris: '4', Kolom: '4', Grup: '2' }],
      Denah: kls10A.map((s, idx) => ({
        Kelas: 'kls_10a',
        Baris: String(Math.floor(idx / 4) + 1),
        Kolom: String((idx % 4) + 1),
        SiswaID: s.ID
      })),
      Piket: kls10A.map((s, i) => ({
        ID: `pik_${i + 1}`,
        Kelas: 'kls_10a',
        Hari: hariPiket[i % 5],
        SiswaID: s.ID,
        Tugas: tugasPiket[i % 5]
      })),
      Struktur: [
        { ID: 'str_1', Kelas: 'kls_10a', Jabatan: 'Ketua Kelas', SiswaID: 'sis_02', Tingkat: '1' },
        { ID: 'str_2', Kelas: 'kls_10a', Jabatan: 'Wakil Ketua', SiswaID: 'sis_04', Tingkat: '1' },
        { ID: 'str_3', Kelas: 'kls_10a', Jabatan: 'Sekretaris', SiswaID: 'sis_01', Tingkat: '2' },
        { ID: 'str_4', Kelas: 'kls_10a', Jabatan: 'Bendahara', SiswaID: 'sis_03', Tingkat: '2' }
      ],
      Jadwal: [
        { ID: 'jd_1', Kelas: 'kls_10a', Hari: 'Senin', Mulai: '07:00', Selesai: '08:30', Mapel: 'Matematika', Guru: 'Dra. Ratna Sari, M.Pd.', Jenis: 'Pelajaran', Pekan: '' },
        { ID: 'jd_2', Kelas: 'kls_10a', Hari: 'Senin', Mulai: '08:30', Selesai: '09:15', Mapel: 'Bahasa Indonesia', Guru: 'Drs. Hendra Gunawan', Jenis: 'Pelajaran', Pekan: '' },
        { ID: 'jd_3', Kelas: 'kls_10a', Hari: 'Selasa', Mulai: '07:00', Selesai: '08:30', Mapel: 'Informatika', Guru: 'Budi Santoso, S.Kom.', Jenis: 'Pelajaran', Pekan: '' }
      ],
      JadwalAtur: [{ Kelas: 'kls_10a', Sistem: 'reguler', Mulai: '07:00', Durasi: '45', Jumlah: '8', Istirahat: '3:15,6:30' }],
      Akademik: getKaldikJabarEvents('2026/2027').map(e => ({
        ID: e.ID,
        Mulai: e.Mulai,
        Selesai: e.Selesai,
        Kegiatan: e.Kegiatan,
        Jenis: e.Jenis,
        Sumber: e.Sumber || ''
      })),
      TP: [
        { ID: 'tp_1', Kelas: 'kls_10a', Kode: 'TP 1', Tujuan: 'Peserta didik mampu menggeneralisasi sifat-sifat eksponen dan logaritma.', Materi: 'Eksponen & Logaritma', Status: 'Tercapai' },
        { ID: 'tp_2', Kelas: 'kls_10a', Kode: 'TP 2', Tujuan: 'Peserta didik mampu memodelkan dan menyelesaikan SPLTV.', Materi: 'SPLTV', Status: 'Berjalan' }
      ],
      Modul: [
        {
          ID: 'mod_1',
          Kelas: 'kls_10a',
          Judul: 'Eksplorasi Fungsi Kuadrat & Lintasan Parabola',
          Mapel: 'Matematika',
          Alokasi: '2 × 45 menit',
          TPIDs: 'tp_2',
          Pembuka: 'Salam, doa, dan apersepsi lintasan parabola.',
          Inti: 'Eksplorasi grafik f(x) = ax² + bx + c dalam kelompok.',
          Penutup: 'Rangkuman titik puncak dan refleksi.',
          Asesmen: 'Observasi diskusi & Exit Ticket.',
          Media: 'LKPD, GeoGebra',
          Catatan: ''
        }
      ],
      Pemantik: [
        {
          ID: 'pem_1',
          Kelas: 'kls_10a',
          Judul: 'Mengapa Lintasan Air Mancur Berbentuk Parabola?',
          Tautan: 'https://www.geogebra.org',
          Pertanyaan: 'Pada sudut berapa air mencapai titik tertinggi?',
          Slide: 'Lintasan Parabola di Sekitar Kita\n---\nHubungan dengan Persamaan Kuadrat'
        }
      ],
      Mapel: mapelList,
      BerkasCloud: [],
      CBT: [],
      HasilCBT: [],
      Pengguna: penggunaList,
      Akun: akunList
    }
  };
}

async function getDb(): Promise<LocalDb> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.sheets) return parsed as LocalDb;
    }
  } catch (_) {}
  const seeded = await createSeedLocalDb();
  saveDb(seeded);
  return seeded;
}

function saveDb(db: LocalDb) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch (_) {}
}

function getSessions(): Record<string, LocalSession> {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY) || '{}');
  } catch {
    return {};
  }
}

function saveSessions(s: Record<string, LocalSession>) {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(s));
  } catch (_) {}
}

function buatSesi(role: 'admin' | 'staf' | 'siswa', sid: string, nama: string) {
  const token = 'local_' + uidShort() + uidShort();
  const map = getSessions();
  map[token] = { role, sid, nama, expires: Date.now() + 21600 * 1000 };
  saveSessions(map);
  return { token, role, nama };
}

function getSesi(token: string, expectedRole?: 'admin' | 'staf' | 'siswa'): LocalSession {
  const map = getSessions();
  const s = map[token];
  if (!s || Date.now() > s.expires) throw new Error('SESI_HABIS');
  if (expectedRole === 'admin' && s.role !== 'admin') throw new Error('Akses khusus admin.');
  if (expectedRole === 'siswa' && s.role !== 'siswa') throw new Error('SESI_HABIS');
  if (expectedRole === 'staf' && s.role !== 'admin' && s.role !== 'staf') throw new Error('SESI_HABIS');
  return s;
}

function getPengaturanObj(db: LocalDb): Record<string, string> {
  const out = { ...PENGATURAN_AWAL };
  (db.sheets.Pengaturan || []).forEach(r => {
    if (r.Kunci) out[r.Kunci] = r.Nilai ?? '';
  });
  return out;
}

export async function runLocalRpcFallback(fn: string, args: any[]): Promise<any> {
  const db = await getDb();

  if (fn === 'api_status') {
    const set = getPengaturanObj(db);
    const em = String(set.emailPemulihan || '').trim();
    const emailHint = em.includes('@')
      ? `${em.slice(0, Math.min(2, em.indexOf('@')))}***@${em.split('@')[1]}`
      : '';
    return {
      adminAda: !!db.admin,
      sekolah: set.sekolah || 'SMA Negeri 1 Nusantara',
      logo: set.logo || '',
      jurusan: set.jurusan || '',
      jurusanLogos: set.jurusanLogos || '{}',
      waInfo: set.waInfo || '',
      emailHint
    };
  }

  if (fn === 'api_updateLoginBranding') {
    const [logo, jurusan, sekolah, jurusanLogos] = args;
    const cur = getPengaturanObj(db);
    const cleanJurusanList = Array.from(
      new Set(String(jurusan || '').split(',').map(x => x.trim()).filter(Boolean))
    );
    let nextLogosStr = cur.jurusanLogos || '{}';
    if (jurusanLogos !== undefined) {
      const parsed = typeof jurusanLogos === 'string' ? JSON.parse(jurusanLogos || '{}') : jurusanLogos || {};
      const filtered: Record<string, string> = {};
      cleanJurusanList.forEach(j => {
        if (typeof parsed[j] === 'string' && parsed[j].startsWith('data:image/')) filtered[j] = parsed[j];
      });
      nextLogosStr = JSON.stringify(filtered);
    }
    const baru: Record<string, string> = {
      ...cur,
      logo: String(logo || '').trim(),
      jurusan: cleanJurusanList.join(', '),
      jurusanLogos: nextLogosStr,
      ...(String(sekolah || '').trim() ? { sekolah: String(sekolah).trim() } : {})
    };
    db.sheets.Pengaturan = Object.entries(baru).map(([Kunci, Nilai]) => ({ Kunci, Nilai }));
    saveDb(db);
    return {
      sekolah: baru.sekolah || 'SMA Negeri 1 Nusantara',
      logo: baru.logo || '',
      jurusan: baru.jurusan || '',
      jurusanLogos: baru.jurusanLogos || '{}'
    };
  }

  if (fn === 'api_setupAdmin') {
    const [user, pass] = args;
    const u = String(user || '').trim().toLowerCase();
    const p = String(pass || '');
    if (u.length < 3) throw new Error('Nama pengguna minimal 3 karakter.');
    if (p.length < 8) throw new Error('Kata sandi minimal 8 karakter.');
    db.admin = { user: u, passHash: await sha256Base64('local-admin', p) };
    saveDb(db);
    return buatSesi('admin', '', u);
  }

  if (fn === 'api_login') {
    const [mode, user, pass] = args;
    const userRaw = String(user || '').trim().toLowerCase();
    const userNisNorm = userRaw.replace(/\s+/g, '');
    const passRaw = String(pass || '');
    const passTrim = passRaw.trim();
    if (!userRaw || !passTrim) throw new Error('Lengkapi data masuk.');

    if (mode === 'admin') {
      if (db.admin && db.admin.user === userRaw) {
        const h1 = await sha256Base64('local-admin', passRaw);
        const h2 = await sha256Base64('local-admin', passTrim);
        if (h1 === db.admin.passHash || h2 === db.admin.passHash) {
          return buatSesi('admin', '', userRaw);
        }
      }
      const stafList = db.sheets.Pengguna || [];
      for (const st of stafList) {
        if (String(st.Username || '').trim().toLowerCase() === userRaw) {
          const h1 = await sha256Base64(st.ID, passRaw);
          const h2 = await sha256Base64(st.ID, passTrim);
          if (st.Hash === h1 || st.Hash === h2) {
            return buatSesi('staf', st.ID, st.Nama);
          }
        }
      }
    }

    const akun = db.sheets.Akun || [];
    const siswaMatches = (db.sheets.Siswa || []).filter(
      s => String(s.NIS || '').replace(/\s+/g, '').toLowerCase() === userNisNorm
    );
    for (const s of siswaMatches) {
      const h = await sha256Base64(s.ID, passTrim);
      if (akun.some(a => a.SiswaID === s.ID && a.Hash === h)) {
        return buatSesi('siswa', s.ID, s.Nama);
      }
    }
    throw new Error('Nama pengguna / NIS atau kata sandi / PIN salah.');
  }

  if (fn === 'api_logout') {
    const [token] = args;
    const map = getSessions();
    delete map[token];
    saveSessions(map);
    return true;
  }

  if (fn === 'api_load') {
    const [token] = args;
    const s = getSesi(token, 'staf');
    const staf = s.role === 'staf' ? (db.sheets.Pengguna || []).find(u => u.ID === s.sid) : null;
    const out: Record<string, any> = {};
    Object.keys(db.sheets).forEach(k => {
      if (!['Pengaturan', 'Akun', 'Pengguna'].includes(k)) {
        out[k] = db.sheets[k] || [];
      }
    });
    out.Pengaturan = getPengaturanObj(db);
    const akunRows = db.sheets.Akun || [];
    out.punyaPIN = akunRows.map(a => a.SiswaID);
    const pinHashes: Record<string, string> = {};
    akunRows.forEach(a => {
      pinHashes[a.SiswaID] = a.Hash;
    });
    out.pinHashes = pinHashes;
    out.peran = s.role === 'admin' ? 'admin' : staf?.Peran || 'guru';
    out.kelasWali = staf ? String(staf.KelasWali || '').split(',').filter(Boolean) : null;
    out.namaPengguna = s.nama || '';
    out.GuruList = (db.sheets.Pengguna || []).map(u => ({
      Nama: u.Nama,
      Mapel: u.Mapel,
      KelasWali: u.KelasWali || '',
      KelasMengajar: u.KelasMengajar || ''
    }));
    out.mapelSaya = staf ? staf.Mapel || '' : '';
    out.adminUser = s.role === 'admin' ? db.admin?.user || '' : '';
    out.urlSheet = '';
    if (s.role === 'admin') {
      out.Pengguna = (db.sheets.Pengguna || []).map(({ Hash: _h, ...rest }) => rest);
    }
    return out;
  }

  if (fn === 'api_saveSheet') {
    const [token, nama, rows] = args;
    getSesi(token, 'staf');
    db.sheets[nama] = Array.isArray(rows) ? rows : [];
    saveDb(db);
    return true;
  }

  if (fn === 'api_savePengaturan') {
    const [token, obj] = args;
    getSesi(token, 'admin');
    db.sheets.Pengaturan = Object.entries(obj || {}).map(([Kunci, Nilai]) => ({
      Kunci,
      Nilai: Nilai == null ? '' : String(Nilai)
    }));
    saveDb(db);
    return true;
  }

  if (fn === 'api_saveAbsensi') {
    const [token, kelas, tanggal, recs] = args;
    getSesi(token, 'staf');
    const kept = (db.sheets.Absensi || []).filter(a => !(a.Kelas === kelas && a.Tanggal === tanggal));
    (recs || []).forEach((r: any) =>
      kept.push({
        Kelas: kelas,
        Tanggal: tanggal,
        SiswaID: r.SiswaID,
        Kode: r.Kode,
        Keterangan: r.Keterangan || '',
        Sumber: ''
      })
    );
    db.sheets.Absensi = kept;
    saveDb(db);
    return true;
  }

  if (fn === 'api_getPinHashes') {
    const [token] = args;
    getSesi(token, 'staf');
    const out: Record<string, string> = {};
    (db.sheets.Akun || []).forEach(a => {
      out[a.SiswaID] = a.Hash;
    });
    return out;
  }

  if (fn === 'api_setPIN') {
    const [token, sid, pinIn] = args;
    getSesi(token, 'staf');
    const pin = String(pinIn || '').trim() || String(Math.floor(100000 + Math.random() * 900000));
    if (!/^\d{4,8}$/.test(pin)) throw new Error('PIN harus 4-8 angka.');
    const h = await sha256Base64(sid, pin);
    const akun = (db.sheets.Akun || []).filter(a => a.SiswaID !== sid);
    akun.push({ SiswaID: sid, Hash: h });
    db.sheets.Akun = akun;
    saveDb(db);
    return pin;
  }

  if (fn === 'api_buatPINSemua') {
    const [token, targetKelas, timpa, pinSeragam] = args;
    getSesi(token, 'staf');
    const seragam = String(pinSeragam || '').trim();
    if (seragam && !/^\d{4,8}$/.test(seragam)) throw new Error('PIN harus 4-8 angka.');
    const akunMap = new Map((db.sheets.Akun || []).map(a => [a.SiswaID, a.Hash]));
    const daftar: any[] = [];
    let dilewati = 0;
    for (const s of db.sheets.Siswa || []) {
      if (targetKelas !== '__ALL__' && s.Kelas !== targetKelas) continue;
      if (!timpa && akunMap.has(s.ID)) continue;
      if (!String(s.NIS || '').trim()) {
        dilewati++;
        continue;
      }
      const pin = seragam || String(Math.floor(100000 + Math.random() * 900000));
      akunMap.set(s.ID, await sha256Base64(s.ID, pin));
      daftar.push({ id: s.ID, nama: s.Nama, nis: s.NIS, pin });
    }
    db.sheets.Akun = Array.from(akunMap.entries()).map(([SiswaID, Hash]) => ({ SiswaID, Hash }));
    saveDb(db);
    return {
      daftar,
      dilewati,
      pinHashes: Object.fromEntries(akunMap.entries())
    };
  }

  if (fn === 'api_simpanPengguna') {
    const [token, d] = args;
    getSesi(token, 'admin');
    const list = db.sheets.Pengguna || [];
    const id = d.ID || uidShort();
    const kw = Array.isArray(d.KelasWali) ? d.KelasWali : [];
    const km = Array.isArray(d.KelasMengajar) ? d.KelasMengajar : [];
    const peran = (kw.length ? ['wali'] : []).concat(km.length ? ['guru'] : []);
    const semuaKelas = Array.from(new Set([...kw, ...km]));
    let sandi = String(d.Sandi || '').trim();
    const existing = list.find(u => u.ID === id);
    if (!existing && !sandi) sandi = String(Math.floor(10000000 + Math.random() * 89999999));
    const hash = sandi ? await sha256Base64(id, sandi) : existing?.Hash || '';
    const rec = {
      ID: id,
      Nama: String(d.Nama || '').trim(),
      Username: String(d.Username || '').trim().toLowerCase(),
      Peran: peran.join(','),
      Kelas: semuaKelas.join(','),
      Hash: hash,
      Mapel: Array.isArray(d.Mapel) ? d.Mapel.join(',') : '',
      KelasWali: kw.join(','),
      KelasMengajar: km.join(',')
    };
    const nextList = existing ? list.map(u => (u.ID === id ? rec : u)) : [...list, rec];
    db.sheets.Pengguna = nextList;
    saveDb(db);
    return {
      daftar: nextList.map(({ Hash: _h, ...rest }) => rest),
      sandi,
      username: rec.Username
    };
  }

  if (fn === 'api_hapusPengguna') {
    const [token, id] = args;
    getSesi(token, 'admin');
    db.sheets.Pengguna = (db.sheets.Pengguna || []).filter(u => u.ID !== id);
    saveDb(db);
    return db.sheets.Pengguna.map(({ Hash: _h, ...rest }) => rest);
  }

  if (fn === 'api_resetSandiPengguna') {
    const [token, id, sandiIn] = args;
    getSesi(token, 'admin');
    const sandi = String(sandiIn || '').trim() || String(Math.floor(10000000 + Math.random() * 89999999));
    const u = (db.sheets.Pengguna || []).find(x => x.ID === id);
    if (!u) throw new Error('Pengguna tidak ditemukan.');
    u.Hash = await sha256Base64(u.ID, sandi);
    saveDb(db);
    return { sandi, username: u.Username };
  }

  if (fn === 'api_gantiSandiSaya') {
    const [token, lama, baru] = args;
    const s = getSesi(token, 'staf');
    const u = (db.sheets.Pengguna || []).find(x => x.ID === s.sid);
    if (!u || u.Hash !== (await sha256Base64(u.ID, String(lama || '')))) throw new Error('Kata sandi lama salah.');
    u.Hash = await sha256Base64(u.ID, String(baru || ''));
    saveDb(db);
    return true;
  }

  if (fn === 'api_loadSiswa') {
    const [token] = args;
    const sesi = getSesi(token, 'siswa');
    const siswa = (db.sheets.Siswa || []).find(x => x.ID === sesi.sid);
    if (!siswa) throw new Error('SESI_HABIS');
    const kelas = (db.sheets.Kelas || []).find(k => k.ID === siswa.Kelas) || { ID: '', Nama: '', Jurusan: '', Mapel: '' };
    const set = getPengaturanObj(db);
    const absKelas = (db.sheets.Absensi || []).filter(a => a.Kelas === siswa.Kelas);
    const tglSet = new Set(absKelas.map(a => a.Tanggal));
    const nm: Record<string, string> = {};
    (db.sheets.Siswa || []).filter(s => s.Kelas === siswa.Kelas).forEach(s => (nm[s.ID] = s.Nama));
    const atur = (db.sheets.DenahAtur || []).find(a => a.Kelas === siswa.Kelas) || { Baris: '4', Kolom: '4', Grup: '2' };
    const pg = (db.sheets.Pengumpulan || []).filter(p => p.SiswaID === siswa.ID);

    return {
      siswa: { Nama: siswa.Nama, NIS: siswa.NIS },
      kelas: kelas.Nama || '',
      jurusan: kelas.Jurusan || '',
      jurusanLogo: '',
      mapel: kelas.Mapel || '',
      sekolah: set.sekolah,
      logo: set.logo || '',
      waInfo: set.waInfo || '',
      semester: set.semester,
      wali: set.wali,
      guru: set.guru,
      denah: {
        Baris: atur.Baris,
        Kolom: atur.Kolom,
        Grup: atur.Grup,
        kursi: (db.sheets.Denah || [])
          .filter(d => d.Kelas === siswa.Kelas && nm[d.SiswaID])
          .map(d => ({ Baris: d.Baris, Kolom: d.Kolom, Nama: nm[d.SiswaID], Saya: d.SiswaID === siswa.ID }))
      },
      piket: (db.sheets.Piket || [])
        .filter(p => p.Kelas === siswa.Kelas && nm[p.SiswaID])
        .map(p => ({ Hari: p.Hari, Tugas: p.Tugas, Nama: nm[p.SiswaID], Saya: p.SiswaID === siswa.ID })),
      struktur: (db.sheets.Struktur || [])
        .filter(s => s.Kelas === siswa.Kelas)
        .map(s => ({ Jabatan: s.Jabatan, Tingkat: s.Tingkat, Nama: nm[s.SiswaID] || '', Saya: s.SiswaID === siswa.ID })),
      jadwal: (db.sheets.Jadwal || []).filter(j => j.Kelas === siswa.Kelas),
      sekretaris: (db.sheets.Struktur || []).some(
        j => j.Kelas === siswa.Kelas && j.SiswaID === siswa.ID && /sekretaris/i.test(j.Jabatan)
      ),
      sistemJadwal: ((db.sheets.JadwalAtur || []).find(a => a.Kelas === siswa.Kelas) || {}).Sistem || 'reguler',
      mulaiSemester: set.mulai,
      akademik: db.sheets.Akademik || [],
      pengaturan: {
        kkm: set.kkm,
        b_sikap: set.b_sikap,
        b_tugas: set.b_tugas,
        b_proyek: set.b_proyek,
        b_uts: set.b_uts,
        b_uas: set.b_uas
      },
      totalPertemuan: tglSet.size,
      absensi: absKelas
        .filter(a => a.SiswaID === siswa.ID)
        .map(a => ({ Tanggal: a.Tanggal, Kode: a.Kode, Keterangan: a.Keterangan })),
      tugas: (db.sheets.Tugas || [])
        .filter(t => t.Kelas === siswa.Kelas)
        .map(t => {
          const p = pg.find(x => x.TugasID === t.ID);
          return {
            ID: t.ID,
            Judul: t.Judul,
            Mapel: t.Mapel || '',
            Deskripsi: t.Deskripsi || '',
            Jenis: t.Jenis,
            Tenggat: t.Tenggat,
            FileID: t.FileID || '',
            NamaFile: t.NamaFile || '',
            Status: p ? p.Status : 'Belum',
            Nilai: p ? p.Nilai : '',
            FileSiswaID: p ? p.FileID || '' : '',
            NamaFileSiswa: p ? p.NamaFile || '' : '',
            TanggalKumpul: p ? p.TanggalKumpul || '' : '',
            CatatanSiswa: p ? p.CatatanSiswa || '' : ''
          };
        }),
      nilai: (db.sheets.Nilai || []).find(n => n.Kelas === siswa.Kelas && n.SiswaID === siswa.ID) || null,
      cbtList: []
    };
  }

  if (fn === 'api_gantiPIN') {
    const [token, lama, baru] = args;
    const sesi = getSesi(token, 'siswa');
    const pinBaru = String(baru || '').trim();
    if (!/^\d{4,8}$/.test(pinBaru)) throw new Error('PIN baru harus 4-8 angka.');
    const a = (db.sheets.Akun || []).find(x => x.SiswaID === sesi.sid);
    if (!a || a.Hash !== (await sha256Base64(sesi.sid, String(lama || '').trim()))) {
      throw new Error('PIN lama salah.');
    }
    a.Hash = await sha256Base64(sesi.sid, pinBaru);
    saveDb(db);
    return true;
  }

  if (fn === 'api_resetDemo') {
    const [token] = args;
    getSesi(token, 'admin');
    const seeded = await createSeedLocalDb();
    saveDb(seeded);
    return true;
  }

  if (fn === 'api_resetAllData') {
    const [token, opts] = args;
    getSesi(token, 'admin');
    const o = opts || {};
    const operational = [
      'Siswa', 'Absensi', 'Tugas', 'Pengumpulan', 'Nilai', 'Perilaku',
      'Checklist', 'DenahAtur', 'Denah', 'Piket', 'Struktur', 'Jadwal',
      'JadwalAtur', 'Akademik', 'TP', 'Modul', 'Pemantik', 'BerkasCloud',
      'CBT', 'HasilCBT', 'Akun'
    ];
    operational.forEach(s => { db.sheets[s] = []; });
    if (o.resetKelas) db.sheets.Kelas = [];
    if (o.resetMapel) db.sheets.Mapel = [];
    if (o.resetPengguna) db.sheets.Pengguna = [];
    if (o.resetPengaturan) {
      db.sheets.Pengaturan = Object.entries(PENGATURAN_AWAL).map(([Kunci, Nilai]) => ({ Kunci, Nilai }));
    }
    saveDb(db);
    return true;
  }

  if (fn === 'api_resetPartial') {
    const [token, category] = args;
    getSesi(token, 'admin');
    const map: Record<string, string[]> = {
      absensi: ['Absensi'],
      nilai_tugas: ['Tugas', 'Pengumpulan', 'Nilai'],
      cbt: ['CBT', 'HasilCBT'],
      operasional_kelas: ['DenahAtur', 'Denah', 'Piket', 'Struktur', 'Jadwal', 'JadwalAtur'],
      perangkat_ajar: ['TP', 'Modul', 'Pemantik'],
      kalender: ['Akademik', 'Checklist'],
      siswa: ['Siswa', 'Akun']
    };
    const targets = map[category] || [];
    targets.forEach(s => { db.sheets[s] = []; });
    saveDb(db);
    return targets;
  }

  if (fn === 'api_cekSesi') {
    const [token] = args;
    const s = getSesi(token);
    return { role: s.role, nama: s.nama };
  }

  if (fn === 'api_setMapelSaya') {
    const [token, ids] = args;
    const s = getSesi(token, 'staf');
    const u = (db.sheets.Pengguna || []).find(x => x.ID === s.sid);
    if (!u) throw new Error('SESI_HABIS');
    u.Mapel = Array.isArray(ids) ? ids.join(',') : '';
    saveDb(db);
    return u.Mapel;
  }

  if (fn === 'api_gantiAdmin') {
    const [token, userBaru, passLama, passBaru] = args;
    getSesi(token, 'admin');
    if (!db.admin || db.admin.passHash !== (await sha256Base64('local-admin', String(passLama || '')))) {
      throw new Error('Kata sandi lama salah.');
    }
    const u = String(userBaru || '').trim().toLowerCase() || db.admin.user;
    const p = String(passBaru || '') || String(passLama || '');
    if (u.length < 3) throw new Error('Nama pengguna minimal 3 karakter.');
    if (p.length < 8) throw new Error('Kata sandi baru minimal 8 karakter.');
    db.admin = { user: u, passHash: await sha256Base64('local-admin', p) };
    saveDb(db);
    return true;
  }

  if (fn === 'api_absensiKelas') {
    const [token, tanggal] = args;
    const sesi = getSesi(token, 'siswa');
    const siswa = (db.sheets.Siswa || []).find(x => x.ID === sesi.sid);
    if (!siswa) throw new Error('SESI_HABIS');
    const tgl = String(tanggal || fmtYmd(new Date())).slice(0, 10);
    const rec = (db.sheets.Absensi || []).filter(a => a.Kelas === siswa.Kelas && a.Tanggal === tgl);
    return {
      tanggal: tgl,
      siswa: (db.sheets.Siswa || [])
        .filter(x => x.Kelas === siswa.Kelas)
        .sort((a, b) => a.Nama.localeCompare(b.Nama))
        .map(x => ({ ID: x.ID, Nama: x.Nama })),
      catatan: rec.map(a => ({ SiswaID: a.SiswaID, Kode: a.Kode, Keterangan: a.Keterangan })),
      terkunci: rec.some(a => a.Sumber !== 'sekretaris')
    };
  }

  if (fn === 'api_simpanAbsensiSekretaris') {
    const [token, tanggal, recs] = args;
    const sesi = getSesi(token, 'siswa');
    const siswa = (db.sheets.Siswa || []).find(x => x.ID === sesi.sid);
    if (!siswa) throw new Error('SESI_HABIS');
    const tgl = String(tanggal || fmtYmd(new Date())).slice(0, 10);
    const semua = db.sheets.Absensi || [];
    const lama = semua.filter(a => a.Kelas === siswa.Kelas && a.Tanggal === tgl);
    if (lama.some(a => a.Sumber !== 'sekretaris')) {
      throw new Error('Absensi tanggal ini sudah diisi atau dikonfirmasi guru.');
    }
    const baru = (recs || []).map((r: any) => ({
      Kelas: siswa.Kelas,
      Tanggal: tgl,
      SiswaID: r.SiswaID,
      Kode: r.Kode,
      Keterangan: String(r.Keterangan || '').slice(0, 200),
      Sumber: 'sekretaris'
    }));
    db.sheets.Absensi = semua.filter(a => !(a.Kelas === siswa.Kelas && a.Tanggal === tgl)).concat(baru);
    saveDb(db);
    return baru.length;
  }

  throw new Error('Operasi ini membutuhkan koneksi server backend aktif.');
}

export async function runLocalKaldikSyncFallback(body: any): Promise<any> {
  const db = await getDb();
  const ta = String(body?.tahunAjaran || KALDIK_JABAR_REF.tahunAjaran).trim();
  const events: Record<string, string>[] = getKaldikJabarEvents(ta).map(e => ({
    ID: e.ID,
    Mulai: e.Mulai,
    Selesai: e.Selesai,
    Kegiatan: e.Kegiatan,
    Jenis: e.Jenis,
    Sumber: e.Sumber || ''
  }));
  const existingNonJabar = (db.sheets.Akademik || []).filter(
    a => !String(a.ID).startsWith('jabar_') && !String(a.Sumber || '').includes('Jabar')
  );
  const nextAkademik = [...existingNonJabar, ...events];
  const now = new Date();
  const nowStr = `${fmtYmd(now)} ${pad2(now.getHours())}:${pad2(now.getMinutes())}`;
  const set = {
    ...getPengaturanObj(db),
    kaldikAutoSync: '1',
    kaldikWilayah: KALDIK_JABAR_REF.wilayah,
    kaldikTahunAjaran: ta,
    kaldikLastSync: nowStr
  };
  db.sheets.Akademik = nextAkademik;
  db.sheets.Pengaturan = Object.entries(set).map(([Kunci, Nilai]) => ({ Kunci, Nilai }));
  saveDb(db);
  return {
    akademik: nextAkademik,
    pengaturan: set,
    addedCount: events.length,
    sourceNote: `${KALDIK_JABAR_REF.dasarSurat} (${ta})`
  };
}
