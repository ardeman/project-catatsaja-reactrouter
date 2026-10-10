// Release notes shown on /changelog, newest first. Each entry is written for
// people using the app (what changed for them, not how), in both languages.
// Add an entry whenever a change people can notice is released.

type TText = { en: string; id: string }

export type TChangeKind = 'new' | 'improved' | 'fixed'

export type TRelease = {
  date: string // YYYY-MM-DD
  title: TText
  changes: { kind: TChangeKind; text: TText }[]
}

export const releases: TRelease[] = [
  {
    date: '2026-10-10',
    title: { en: 'Finances', id: 'Keuangan' },
    changes: [
      {
        kind: 'fixed',
        text: {
          en: 'Sign-in, sign-up and password reset fit better on phones, with clear headings, larger controls and accessible password visibility buttons.',
          id: 'Halaman masuk, pendaftaran, dan pengaturan ulang kata sandi lebih nyaman di ponsel, dengan judul yang jelas, kontrol lebih besar, dan tombol tampilan kata sandi yang mudah diakses.',
        },
      },
      {
        kind: 'fixed',
        text: {
          en: 'Footer links use consistent spacing on the landing, public, sign-in and error pages, with room for your phone’s home indicator.',
          id: 'Tautan bagian bawah memiliki jarak yang konsisten di halaman depan, publik, masuk, dan galat, dengan ruang untuk indikator beranda ponselmu.',
        },
      },
      {
        kind: 'improved',
        text: {
          en: 'Glass styling now carries across the landing page, public pages, sign-in forms, settings, cards, menus and dialogs.',
          id: 'Tampilan kaca kini hadir di halaman depan, halaman publik, formulir masuk, pengaturan, kartu, menu, dan dialog.',
        },
      },
      {
        kind: 'fixed',
        text: {
          en: 'The glass search dropdown now blurs the page behind its results.',
          id: 'Daftar hasil pencarian dengan efek kaca kini memburamkan halaman di belakangnya.',
        },
      },
      {
        kind: 'improved',
        text: {
          en: 'Navigation, search results and floating controls have a glass finish, with solid surfaces when you prefer reduced transparency.',
          id: 'Navigasi, hasil pencarian, dan kontrol mengambang tampil dengan efek kaca, dengan permukaan solid jika kamu memilih pengurangan transparansi.',
        },
      },
      {
        kind: 'fixed',
        text: {
          en: 'Search results stay above the action buttons while viewing a note, task or finance book.',
          id: 'Hasil pencarian tetap berada di atas tombol tindakan saat membuka catatan, tugas, atau buku keuangan.',
        },
      },
      {
        kind: 'improved',
        text: {
          en: 'On phones, switch between notes, tasks and finances with tabs at the bottom of the screen.',
          id: 'Di ponsel, berpindah antara catatan, tugas, dan keuangan melalui tab di bagian bawah layar.',
        },
      },
      {
        kind: 'improved',
        text: {
          en: 'Add a currency directly from a finance book’s currency picker and use it immediately.',
          id: 'Tambahkan mata uang langsung dari pilihan mata uang buku keuangan dan gunakan segera.',
        },
      },
      {
        kind: 'fixed',
        text: {
          en: 'Loading icons change smoothly between animation cycles and stay still when your device requests reduced motion.',
          id: 'Ikon pemuatan berganti dengan mulus di antara siklus animasi dan tetap diam saat perangkatmu meminta pengurangan gerakan.',
        },
      },
      {
        kind: 'improved',
        text: {
          en: 'Search and finance books do less repeated work when you move through results or edit a title.',
          id: 'Pencarian dan buku keuangan kini mengurangi pemrosesan berulang saat kamu menelusuri hasil atau mengubah judul.',
        },
      },
      {
        kind: 'fixed',
        text: {
          en: 'Sharing searches clear old results and show errors inside the dialog. Closing a page while signing in no longer leaves a data listener running.',
          id: 'Pencarian pengguna untuk berbagi membersihkan hasil lama dan menampilkan galat di dalam dialog. Menutup halaman saat masuk tidak lagi meninggalkan pemantau data yang berjalan.',
        },
      },
      {
        kind: 'fixed',
        text: {
          en: 'Examples for exchange rates and minimum decimals now use your chosen number separators.',
          id: 'Contoh kurs dan desimal minimum kini memakai pemisah angka yang kamu pilih.',
        },
      },
      {
        kind: 'fixed',
        text: {
          en: 'Search results are no longer covered by the button for creating a note, task or finance book.',
          id: 'Hasil pencarian tidak lagi tertutup tombol untuk membuat catatan, tugas, atau buku keuangan.',
        },
      },
      {
        kind: 'new',
        text: {
          en: 'Search finds notes, tasks and finances at once, with the matching words highlighted. Use the arrow keys and Enter, and press Ctrl K (⌘ K on a Mac) or / to search from anywhere.',
          id: 'Pencarian menemukan catatan, tugas, dan keuangan sekaligus, dengan kata yang cocok ditandai. Pakai tombol panah dan Enter, dan tekan Ctrl K (⌘ K di Mac) atau / untuk mencari dari mana saja.',
        },
      },
      {
        kind: 'improved',
        text: {
          en: 'Settings are easier to use: theme, text size and language are picked from cards and saved as soon as you choose, numbers have Indonesian and international presets, and each currency shows its rate in your default currency.',
          id: 'Pengaturan lebih mudah dipakai: tema, ukuran teks, dan bahasa dipilih dari kartu dan langsung tersimpan, format angka punya pilihan Indonesia dan internasional, dan setiap mata uang menampilkan kursnya dalam mata uang default.',
        },
      },
      {
        kind: 'improved',
        text: {
          en: 'The navigation bar has icons, the logo takes you to your notes, and the account menu shows your email.',
          id: 'Bilah navigasi kini punya ikon, logo membawamu ke catatan, dan menu akun menampilkan email-mu.',
        },
      },
      {
        kind: 'new',
        text: {
          en: 'Finances: keep books for a month, a trip or a project, record income and expenses by category, and see the balance. Share a book like a note.',
          id: 'Keuangan: buat buku untuk sebulan, perjalanan, atau proyek, catat pemasukan dan pengeluaran per kategori, dan lihat saldonya. Bagikan buku seperti catatan.',
        },
      },
      {
        kind: 'new',
        text: {
          en: 'Entries can be in any of your currencies: the exchange rate is filled in from your settings and saved with the entry, so totals never change later.',
          id: 'Entri bisa memakai mata uang apa pun milikmu: kurs diisi dari pengaturan dan disimpan bersama entri, jadi totalnya tidak berubah di kemudian hari.',
        },
      },
      {
        kind: 'new',
        text: {
          en: 'The entry form picks the category for you: the one you used last, or the one you used before for the same words ("Grab" → Transport). Your own choice always wins.',
          id: 'Form entri memilihkan kategori: yang terakhir kamu pakai, atau yang dulu dipakai untuk kata yang sama ("Grab" → Transportasi). Pilihanmu sendiri selalu diutamakan.',
        },
      },
      {
        kind: 'new',
        text: {
          en: 'Add a currency right from the entry form.',
          id: 'Tambahkan mata uang langsung dari form entri.',
        },
      },
      {
        kind: 'fixed',
        text: {
          en: 'Code blocks in notes now follow the light or dark theme.',
          id: 'Blok kode di catatan kini mengikuti tema terang atau gelap.',
        },
      },
      {
        kind: 'improved',
        text: {
          en: 'Amounts show thousands separators as you type, in your own number format, and dates are picked from a calendar with Today and Yesterday shortcuts.',
          id: 'Nominal menampilkan pemisah ribuan saat diketik, sesuai format angkamu, dan tanggal dipilih dari kalender dengan pintasan Hari ini dan Kemarin.',
        },
      },
      {
        kind: 'fixed',
        text: {
          en: 'Choosing another language in the settings no longer shows an error.',
          id: 'Memilih bahasa lain di pengaturan tidak lagi memunculkan galat.',
        },
      },
      {
        kind: 'improved',
        text: {
          en: 'Currency settings explain what the exchange rate means and accept very small rates.',
          id: 'Pengaturan mata uang menjelaskan arti kurs dan menerima kurs yang sangat kecil.',
        },
      },
      {
        kind: 'fixed',
        text: {
          en: 'The status bar and window bar now follow the theme you pick in the app, not only your device setting.',
          id: 'Bar status dan bar jendela kini mengikuti tema yang kamu pilih di aplikasi, bukan hanya pengaturan perangkat.',
        },
      },
      {
        kind: 'fixed',
        text: {
          en: 'With the System theme, the app now switches right away when your device changes between light and dark.',
          id: 'Dengan tema Sistem, aplikasi kini langsung berganti saat perangkatmu beralih antara terang dan gelap.',
        },
      },
      {
        kind: 'fixed',
        text: {
          en: 'Pages no longer flash the wrong theme or text size while the app starts.',
          id: 'Halaman tidak lagi sempat menampilkan tema atau ukuran teks yang salah saat aplikasi dibuka.',
        },
      },
    ],
  },
  {
    date: '2026-10-09',
    title: {
      en: 'A home page, safer sharing and saving you can trust',
      id: 'Halaman utama, berbagi yang lebih aman, dan penyimpanan yang bisa diandalkan',
    },
    changes: [
      {
        kind: 'new',
        text: {
          en: 'A home page that shows what Catat Saja does, in English and Bahasa Indonesia.',
          id: 'Halaman utama yang menjelaskan Catat Saja, dalam Bahasa Indonesia dan Inggris.',
        },
      },
      {
        kind: 'new',
        text: {
          en: 'Search: type in the search bar to find notes and tasks by their title or text.',
          id: 'Pencarian: ketik di kolom cari untuk menemukan catatan dan tugas dari judul atau isinya.',
        },
      },
      {
        kind: 'new',
        text: {
          en: 'Install Catat Saja as an app on your phone or computer: use "Install app" on the home page or in the account menu. It opens in its own window and starts even without a connection.',
          id: 'Pasang Catat Saja sebagai aplikasi di ponsel atau komputer: pakai "Pasang aplikasi" di halaman utama atau menu akun. Aplikasi terbuka di jendelanya sendiri dan tetap bisa dibuka tanpa koneksi.',
        },
      },
      {
        kind: 'new',
        text: {
          en: 'This changelog.',
          id: 'Halaman catatan perubahan ini.',
        },
      },
      {
        kind: 'improved',
        text: {
          en: 'Notes and tasks save as you type and when you leave the page, with a "Saving… / Saved" status. A new note or task is kept when you leave it.',
          id: 'Catatan dan tugas tersimpan saat kamu mengetik dan saat meninggalkan halaman, dengan status "Menyimpan… / Tersimpan". Catatan atau tugas baru tetap tersimpan saat kamu keluar.',
        },
      },
      {
        kind: 'improved',
        text: {
          en: 'Read-only sharing is now enforced: people you share with as read-only can no longer change your notes or tasks.',
          id: 'Berbagi hanya baca kini benar-benar berlaku: orang yang kamu beri akses hanya baca tidak bisa lagi mengubah catatan atau tugasmu.',
        },
      },
      {
        kind: 'improved',
        text: {
          en: 'Tasks: tap an item to edit it, and finished items move to a "Completed" group.',
          id: 'Tugas: ketuk item untuk mengubahnya, dan item yang selesai pindah ke kelompok "Selesai".',
        },
      },
      {
        kind: 'improved',
        text: {
          en: 'Lists show pinned items first, and pinning no longer changes the "edited" date.',
          id: 'Daftar menampilkan yang disematkan lebih dulu, dan menyematkan tidak lagi mengubah tanggal "diedit".',
        },
      },
      {
        kind: 'improved',
        text: {
          en: 'You can undo removing someone from a shared note or task.',
          id: 'Kamu bisa mengurungkan penghapusan seseorang dari catatan atau tugas yang dibagikan.',
        },
      },
      {
        kind: 'improved',
        text: {
          en: 'Clearer buttons with labels, larger touch targets on phones, and easier-to-read messages in both languages.',
          id: 'Tombol yang lebih jelas dengan label, area sentuh yang lebih besar di ponsel, dan pesan yang lebih mudah dipahami dalam kedua bahasa.',
        },
      },
      {
        kind: 'fixed',
        text: {
          en: 'Words typed right before leaving a note could be lost.',
          id: 'Kata yang diketik tepat sebelum meninggalkan catatan bisa hilang.',
        },
      },
      {
        kind: 'fixed',
        text: {
          en: 'Some new accounts could not create notes or be found for sharing.',
          id: 'Beberapa akun baru tidak bisa membuat catatan atau ditemukan untuk berbagi.',
        },
      },
      {
        kind: 'fixed',
        text: {
          en: 'Bold text and headings in notes were hard to read in dark mode.',
          id: 'Teks tebal dan judul di catatan sulit dibaca di mode gelap.',
        },
      },
    ],
  },
  {
    date: '2025-07-31',
    title: { en: 'Currencies', id: 'Mata uang' },
    changes: [
      {
        kind: 'new',
        text: {
          en: 'Add your own currencies with a symbol, code, number of decimals and exchange rate, and pick a default one.',
          id: 'Tambahkan mata uangmu sendiri dengan simbol, kode, jumlah desimal, dan kurs, lalu pilih satu sebagai default.',
        },
      },
      {
        kind: 'new',
        text: {
          en: 'Choose how amounts are written: separators, decimals, symbol or code, before or after the amount, with a live preview.',
          id: 'Atur cara penulisan jumlah uang: pemisah, desimal, simbol atau kode, di depan atau di belakang angka, dengan pratinjau langsung.',
        },
      },
      {
        kind: 'new',
        text: {
          en: 'Account settings: change your email address, verify it and link your Google account.',
          id: 'Pengaturan akun: ubah alamat email, verifikasi, dan hubungkan akun Google-mu.',
        },
      },
    ],
  },
  {
    date: '2025-07-25',
    title: {
      en: 'Live updates and sharing links',
      id: 'Pembaruan langsung dan tautan berbagi',
    },
    changes: [
      {
        kind: 'new',
        text: {
          en: 'An open note or task updates by itself when someone you share it with changes it.',
          id: 'Catatan atau tugas yang sedang dibuka langsung diperbarui saat orang yang kamu bagikan mengubahnya.',
        },
      },
      {
        kind: 'new',
        text: {
          en: 'Copy a link to a note or task from the share window.',
          id: 'Salin tautan catatan atau tugas dari jendela berbagi.',
        },
      },
      {
        kind: 'new',
        text: {
          en: 'Undo after removing an item from a task.',
          id: 'Urungkan setelah menghapus item dari tugas.',
        },
      },
      {
        kind: 'improved',
        text: {
          en: 'A "page not found" page for links that no longer work.',
          id: 'Halaman "tidak ditemukan" untuk tautan yang sudah tidak berlaku.',
        },
      },
    ],
  },
  {
    date: '2025-07-22',
    title: {
      en: 'Rich notes and quicker checklists',
      id: 'Catatan yang lebih kaya dan daftar tugas yang lebih cepat',
    },
    changes: [
      {
        kind: 'new',
        text: {
          en: 'Notes have a rich text editor: headings, lists, bold and more, shown formatted in the notes list too.',
          id: 'Catatan punya editor teks kaya: judul, daftar, teks tebal, dan lainnya, juga tampil rapi di daftar catatan.',
        },
      },
      {
        kind: 'new',
        text: {
          en: 'Paste several lines into a task to add them as separate items.',
          id: 'Tempel beberapa baris ke tugas untuk menambahkannya sebagai item terpisah.',
        },
      },
      {
        kind: 'new',
        text: {
          en: 'Reorder task items, and check or uncheck them all at once.',
          id: 'Ubah urutan item tugas, dan centang atau hapus centang semuanya sekaligus.',
        },
      },
      {
        kind: 'improved',
        text: {
          en: 'Move between the title and items with the arrow keys and Enter.',
          id: 'Pindah antara judul dan item dengan tombol panah dan Enter.',
        },
      },
    ],
  },
  {
    date: '2025-07-18',
    title: { en: 'Tasks', id: 'Tugas' },
    changes: [
      {
        kind: 'new',
        text: {
          en: 'Checklists you can pin and share, like notes, with a count of finished items.',
          id: 'Daftar tugas yang bisa disematkan dan dibagikan seperti catatan, lengkap dengan jumlah item yang selesai.',
        },
      },
      {
        kind: 'improved',
        text: {
          en: 'Opening a note or task you no longer have access to takes you back safely.',
          id: 'Membuka catatan atau tugas yang sudah tidak bisa kamu akses akan membawamu kembali dengan aman.',
        },
      },
    ],
  },
  {
    date: '2025-07-14',
    title: {
      en: 'Note pages and appearance',
      id: 'Halaman catatan dan tampilan',
    },
    changes: [
      {
        kind: 'new',
        text: {
          en: 'Each note opens on its own page that you can link to.',
          id: 'Setiap catatan terbuka di halamannya sendiri yang bisa kamu tautkan.',
        },
      },
      {
        kind: 'new',
        text: {
          en: 'Choose light, dark or system theme, text size and language, and see the result before saving.',
          id: 'Pilih tema terang, gelap, atau sistem, ukuran teks, dan bahasa, lalu lihat hasilnya sebelum menyimpan.',
        },
      },
      {
        kind: 'new',
        text: {
          en: 'Install Catat Saja on your phone or computer like an app.',
          id: 'Pasang Catat Saja di ponsel atau komputer seperti aplikasi.',
        },
      },
    ],
  },
  {
    date: '2024-12-29',
    title: { en: 'First release', id: 'Rilis pertama' },
    changes: [
      {
        kind: 'new',
        text: {
          en: 'Write notes, pin the important ones and share them with other users, read-only or editable.',
          id: 'Tulis catatan, sematkan yang penting, dan bagikan ke pengguna lain, hanya baca atau boleh diubah.',
        },
      },
      {
        kind: 'new',
        text: {
          en: 'Sign in with email and password or with Google.',
          id: 'Masuk dengan email dan kata sandi atau dengan Google.',
        },
      },
    ],
  },
]
