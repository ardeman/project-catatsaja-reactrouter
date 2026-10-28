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
    date: '2026-10-28',
    title: {
      en: 'Totals by keyword',
      id: 'Jumlah per kata kunci',
    },
    changes: [
      {
        kind: 'improved',
        text: {
          en: 'In a book scrolled down, tap Balance or Difference in the bar at the top to jump back to the totals or the accounts.',
          id: 'Saat buku sudah digulir ke bawah, ketuk Saldo atau Selisih di bilah atas untuk kembali ke total atau ke daftar akun.',
        },
      },
      {
        kind: 'improved',
        text: {
          en: 'Pressing Add entry after scrolling down a book starts the new entry on the day shown just below the button, instead of today.',
          id: 'Menekan Tambah entri setelah menggulir buku ke bawah membuat entri baru dimulai pada tanggal yang tampil tepat di bawah tombol, bukan hari ini.',
        },
      },
      {
        kind: 'improved',
        text: {
          en: 'After adding to a book, with the form, Quick add or a receipt, the page scrolls to the new entries, just below the form, so you can see where they landed.',
          id: 'Setelah menambah entri ke buku, lewat formulir, Tambah cepat, atau struk, halaman bergulir ke entri baru tepat di bawah formulir, jadi kamu bisa melihat di mana entri itu masuk.',
        },
      },
      {
        kind: 'improved',
        text: {
          en: 'Notes open faster: the editor loads a third less. To get there, the Formula button for maths is gone; formulas already in a note stay as text between $ signs.',
          id: 'Catatan terbuka lebih cepat: editornya sepertiga lebih ringan. Untuk itu, tombol Rumus untuk matematika dihapus; rumus yang sudah ada di catatan tetap tersimpan sebagai teks di antara tanda $.',
        },
      },
      {
        kind: 'improved',
        text: {
          en: 'In a book’s Analysis, the totals by category start with one bar that shows the whole split at a glance. Point at or tap a part of it, or point at a category below, to pick it out.',
          id: 'Di Analisis buku, jumlah per kategori kini diawali satu batang yang menunjukkan seluruh pembagiannya sekilas. Arahkan kursor atau ketuk salah satu bagiannya, atau arahkan kursor ke kategori di bawahnya, untuk menyorotnya.',
        },
      },
      {
        kind: 'fixed',
        text: {
          en: 'Holding a finger on a chart on a phone no longer selects its text.',
          id: 'Menahan jari di grafik pada ponsel tidak lagi memilih teksnya.',
        },
      },
      {
        kind: 'improved',
        text: {
          en: 'A book’s Analysis is shorter: fold any card to one line with its gist (such as what came in and went out, or how many budgets are over), long lists show the first five, and cards you haven’t set up start folded. Small shares read <1% instead of 0%, and the cash flow chart’s labels no longer overlap.',
          id: 'Analisis buku kini lebih ringkas: lipat kartu mana pun jadi satu baris berisi intinya (misalnya uang masuk dan keluar, atau berapa anggaran yang terlampaui), daftar panjang menampilkan lima teratas, dan kartu yang belum diatur mulai terlipat. Bagian kecil tertulis <1%, bukan 0%, dan label grafik arus kas tidak lagi bertumpuk.',
        },
      },
      {
        kind: 'new',
        text: {
          en: 'Coming with Catat Saja Plus: keywords in a book’s Analysis, such as bensin or grab, gojek, with what the entries mentioning them add up to in the period (with All, a keyword’s income and spending share one line, with what’s left after spending, and a bar that runs left for spending and right for income). Everyone the book is shared with sees them.',
          id: 'Segera hadir bersama Catat Saja Plus: kata kunci di Analisis buku, misalnya bensin atau grab, gojek, lengkap dengan jumlah catatan yang memuatnya dalam periode itu (dengan Semua, pemasukan dan pengeluaran satu kata kunci tampil di satu baris, beserta selisih bersihnya, dan batang yang ke kiri untuk pengeluaran dan ke kanan untuk pemasukan). Semua orang yang diberi akses ke buku itu bisa melihatnya.',
        },
      },
      {
        kind: 'new',
        text: {
          en: 'Coming with Catat Saja Plus: copy another book’s groups of categories, budgets, keywords, savings goals and payday into a book’s Analysis. What the book already has stays, and amounts are converted with your rates.',
          id: 'Segera hadir bersama Catat Saja Plus: salin kelompok kategori, anggaran, kata kunci, target tabungan, dan tanggal gajian dari buku lain ke Analisis buku. Yang sudah ada di buku itu tetap, dan jumlahnya dikonversi dengan kursmu.',
        },
      },
      {
        kind: 'improved',
        text: {
          en: 'In a book’s Analysis, All now sits beside Expense and Income and is chosen at first: it shows the breakdowns for expenses and income one after the other.',
          id: 'Di Analisis buku, kini ada Semua di samping Pengeluaran dan Pemasukan, dan dipilih sejak awal: rincian pengeluaran dan pemasukan ditampilkan berurutan.',
        },
      },
      {
        kind: 'new',
        text: {
          en: 'Coming with Catat Saja Plus: a budget for all of a book’s spending, beside the budgets per category, and one choice for all of them between every month and the whole book.',
          id: 'Segera hadir bersama Catat Saja Plus: anggaran untuk semua pengeluaran buku, di samping anggaran per kategori, dan satu pilihan untuk semuanya antara per bulan atau seluruh buku.',
        },
      },
      {
        kind: 'fixed',
        text: {
          en: 'Fields and buttons line up again when editing a book’s accounts, budgets and savings goals, and next to a health log’s calorie target, even when a field shows a message below it.',
          id: 'Kolom dan tombol kembali sejajar saat mengubah akun, anggaran, dan target tabungan buku, serta di samping target kalori log kesehatan, meski ada pesan di bawah kolom.',
        },
      },
      {
        kind: 'improved',
        text: {
          en: 'In a book’s Analysis, By item now comes right after By category.',
          id: 'Di Analisis buku, Per item kini tepat setelah Per kategori.',
        },
      },
    ],
  },
  {
    date: '2026-10-27',
    title: {
      en: 'Your cycle at a glance',
      id: 'Siklusmu sekilas',
    },
    changes: [
      {
        kind: 'new',
        text: {
          en: 'Choose the period a book’s Analysis covers and what it groups by: day, week, month, day of the week, category or item. The balance starts from what the book held before the period.',
          id: 'Pilih periode yang dicakup Analisis buku dan cara mengelompokkannya: per hari, minggu, bulan, hari dalam seminggu, kategori, atau item. Saldo dimulai dari isi buku sebelum periode itu.',
        },
      },
      {
        kind: 'new',
        text: {
          en: 'Filter a book’s entries by type, category and period (this month, last month, the last 3 months, this year or dates you choose), with the income and expenses of what is shown.',
          id: 'Saring entri buku menurut jenis, kategori, dan periode (bulan ini, bulan lalu, 3 bulan terakhir, tahun ini, atau tanggal pilihanmu), lengkap dengan pemasukan dan pengeluaran dari yang ditampilkan.',
        },
      },
      {
        kind: 'new',
        text: {
          en: 'A book’s Analysis compares the period with the one before it, or with the same dates a year earlier: income, expenses, net and each category, with how much each changed. This month so far is compared with the same days of last month.',
          id: 'Analisis buku membandingkan periode dengan periode sebelumnya, atau dengan tanggal yang sama setahun sebelumnya: pemasukan, pengeluaran, bersih, dan tiap kategori, lengkap dengan besar perubahannya. Bulan ini sejauh ini dibandingkan dengan hari yang sama di bulan lalu.',
        },
      },
      {
        kind: 'new',
        text: {
          en: 'Give a card a colour and a background emoji with the palette button on it or on its page, which takes on the same look. Notes, lists, books and health logs look the same for everyone you share them with, and the look is encrypted with the rest when you use encryption.',
          id: 'Beri kartu warna dan emoji latar lewat tombol palet di kartu atau halamannya, yang ikut berganti tampilan. Catatan, daftar, buku, dan catatan kesehatan tampil sama bagi semua orang yang kamu bagikan, dan tampilannya ikut dienkripsi bila kamu memakai enkripsi.',
        },
      },
      {
        kind: 'improved',
        text: {
          en: 'In a book’s Analysis and entry filter, Expense and Income now come in the same order, with the same names and icons, and the Analysis figures sit on cards like the rest of the page.',
          id: 'Di Analisis dan saringan entri buku, Pengeluaran dan Pemasukan kini tampil dengan urutan, nama, dan ikon yang sama, dan angka-angka Analisis tampil di kartu seperti bagian lain halaman.',
        },
      },
      {
        kind: 'fixed',
        text: {
          en: 'Opening a book and going back no longer marks it as just edited or moves it to the top of the list.',
          id: 'Membuka buku lalu kembali tidak lagi menandainya baru diubah atau memindahkannya ke atas daftar.',
        },
      },
      {
        kind: 'improved',
        text: {
          en: 'A health log’s card now shows when you are in your fertile window or ovulating, as the overview does, not only when your next period is due.',
          id: 'Kartu catatan kesehatan kini menunjukkan saat kamu sedang dalam masa subur atau ovulasi, seperti ringkasannya, tidak hanya kapan haid berikutnya.',
        },
      },
      {
        kind: 'improved',
        text: {
          en: 'Reminders and Medicines take less room: their explanations moved behind the ⓘ button next to each heading.',
          id: 'Pengingat dan Obat kini lebih ringkas: penjelasannya pindah ke tombol ⓘ di samping judulnya.',
        },
      },
      {
        kind: 'improved',
        text: {
          en: 'The language button now sits beside the page title on the sign-in and public pages, and appears only once.',
          id: 'Tombol bahasa kini ada di samping judul halaman pada halaman masuk dan halaman publik, dan hanya muncul sekali.',
        },
      },
      {
        kind: 'new',
        text: {
          en: 'Coming with Catat Saja Plus: savings goals in a book’s Analysis, such as school fees in July, with how much to put aside each payday so every goal is ready in time, counted from what the book already holds. Everyone the book is shared with sees them.',
          id: 'Segera hadir bersama Catat Saja Plus: target tabungan di Analisis buku, misalnya uang sekolah di bulan Juli, lengkap dengan berapa yang perlu disisihkan setiap gajian agar semua target siap tepat waktu, dihitung dari yang sudah ada di buku. Semua orang yang diberi akses ke buku itu bisa melihatnya.',
        },
      },
      {
        kind: 'new',
        text: {
          en: 'Coming with Catat Saja Plus: budgets in a book’s Analysis, a monthly limit for a category such as food, with what is left to spend this month. Everyone the book is shared with sees them.',
          id: 'Segera hadir bersama Catat Saja Plus: anggaran di Analisis buku, batas bulanan untuk kategori seperti makan, lengkap dengan sisa yang bisa dibelanjakan bulan ini. Semua orang yang diberi akses ke buku itu bisa melihatnya.',
        },
      },
      {
        kind: 'new',
        text: {
          en: 'Coming with Catat Saja Plus: your own groups of categories in a book’s Analysis, such as Needs = food + bills, with what each group adds up to and its share. Everyone the book is shared with sees them.',
          id: 'Segera hadir bersama Catat Saja Plus: grup kategori buatanmu sendiri di Analisis buku, misalnya Kebutuhan = makan + tagihan, lengkap dengan jumlah dan porsi tiap grup. Semua orang yang diberi akses ke buku itu bisa melihatnya.',
        },
      },
    ],
  },
  {
    date: '2026-10-26',
    title: {
      en: 'Reminders come as notifications',
      id: 'Pengingat datang sebagai notifikasi',
    },
    changes: [
      {
        kind: 'new',
        text: {
          en: 'A fertile window reminder: get a notification on the day the fertile window starts, or a few days before. It goes only to you unless you choose to remind the people the log is shared with too. Like the calendar, it is an estimate, not a method of birth control.',
          id: 'Pengingat masa subur: dapatkan notifikasi pada hari masa subur dimulai, atau beberapa hari sebelumnya. Pengingat ini hanya untukmu, kecuali kamu memilih untuk mengingatkan juga orang yang dibagikan catatan ini. Seperti kalendernya, ini hanya perkiraan, bukan metode kontrasepsi.',
        },
      },
      {
        kind: 'improved',
        text: {
          en: 'Health reminders and medicines no longer have an Add to calendar button. Turn on notifications in Settings → General to be alerted on time; due reminders and doses still show in the app.',
          id: 'Pengingat kesehatan dan obat tidak lagi punya tombol Tambah ke kalender. Nyalakan notifikasi di Pengaturan → Umum agar diingatkan tepat waktu; pengingat dan dosis yang jatuh tempo tetap tampil di aplikasi.',
        },
      },
    ],
  },
  {
    date: '2026-10-23',
    title: {
      en: 'Add items anywhere in a list',
      id: 'Tambah item di mana saja dalam daftar',
    },
    changes: [
      {
        kind: 'improved',
        text: {
          en: 'Press Enter while editing a task item to add a new item right below it. Any text after the cursor moves into the new item.',
          id: 'Tekan Enter saat mengedit item tugas untuk menambah item baru tepat di bawahnya. Teks setelah kursor pindah ke item baru itu.',
        },
      },
    ],
  },
  {
    date: '2026-10-21',
    title: {
      en: 'Notifications, asked once',
      id: 'Notifikasi, ditanyakan sekali',
    },
    changes: [
      {
        kind: 'improved',
        text: {
          en: 'The first time you open Catat Saja on a device, it asks whether to send notifications there for invitations, health reminders and medicine doses. Choose Not now and it won’t ask again on that device; you can still turn them on in Settings → General. On iPhone and iPad it explains that notifications need the installed app.',
          id: 'Saat pertama kali membuka Catat Saja di sebuah perangkat, aplikasi menanyakan apakah notifikasi untuk undangan, pengingat kesehatan, dan dosis obat boleh dikirim ke sana. Pilih Nanti saja dan aplikasi tidak akan bertanya lagi di perangkat itu; kamu tetap bisa menyalakannya di Pengaturan → Umum. Di iPhone dan iPad, aplikasi menjelaskan bahwa notifikasi butuh aplikasi yang terpasang.',
        },
      },
      {
        kind: 'fixed',
        text: {
          en: 'Closing the tab right after a change to an encrypted item could lose that change while it was still being encrypted. Your browser now asks before closing until the change is safely stored.',
          id: 'Menutup tab tepat setelah mengubah item terenkripsi bisa membuat perubahan itu hilang selagi masih dienkripsi. Sekarang browser bertanya dulu sebelum ditutup sampai perubahan tersimpan dengan aman.',
        },
      },
      {
        kind: 'fixed',
        text: {
          en: 'A notification for the next dose of the same medicine, or the same invitation again, now alerts you instead of quietly replacing the earlier one.',
          id: 'Notifikasi untuk dosis berikutnya dari obat yang sama, atau undangan yang sama lagi, sekarang memberi tanda alih-alih diam-diam menggantikan notifikasi sebelumnya.',
        },
      },
    ],
  },
  {
    date: '2026-10-20',
    title: {
      en: 'Log sex on the period calendar',
      id: 'Catat hubungan seks di kalender menstruasi',
    },
    changes: [
      {
        kind: 'new',
        text: {
          en: 'Tap a day on the period calendar and choose Sex to log it, protected or unprotected, with a note if you like. The day gets a dot (hollow for protected, filled for unprotected), and it shows in the history next to your periods. People the log is shared with see it too.',
          id: 'Ketuk tanggal di kalender menstruasi lalu pilih Hubungan seks untuk mencatatnya, pakai pengaman atau tanpa pengaman, dengan catatan jika mau. Tanggal itu diberi titik (berlubang untuk pakai pengaman, penuh untuk tanpa pengaman), dan muncul di riwayat di samping menstruasimu. Orang yang diajak berbagi catatan itu juga bisa melihatnya.',
        },
      },
      {
        kind: 'improved',
        text: {
          en: 'If you refused notifications, Settings → General now says how to allow them again in the browser you’re using, or in your phone’s or computer’s settings when you use the installed app.',
          id: 'Jika kamu menolak notifikasi, Pengaturan → Umum kini menjelaskan cara mengizinkannya lagi di browser yang kamu pakai, atau di pengaturan ponsel atau komputermu saat kamu memakai aplikasi yang terpasang.',
        },
      },
    ],
  },
  {
    date: '2026-10-19',
    title: {
      en: 'Medicine reminders and push notifications',
      id: 'Pengingat obat dan notifikasi push',
    },
    changes: [
      {
        kind: 'new',
        text: {
          en: 'Add medicines to a health log: the dose, one or more times a day, how often and for how long (until a date, a number of days or doses, or ongoing). Mark each dose taken or skipped, and see the history and how many doses are left.',
          id: 'Tambahkan obat ke catatan kesehatan: dosisnya, satu kali atau lebih dalam sehari, seberapa sering, dan berapa lama (sampai tanggal tertentu, sejumlah hari atau dosis, atau terus-menerus). Tandai setiap dosis sudah diminum atau dilewati, dan lihat riwayatnya serta sisa dosisnya.',
        },
      },
      {
        kind: 'new',
        text: {
          en: 'Turn on notifications for a device in Settings → General to hear about invitations, health reminders and every medicine dose, even with the app closed. Everyone a health log is shared with gets its reminders. The text is encrypted for each of your devices, so not even we can read it, and you can hide titles from the lock screen.',
          id: 'Nyalakan notifikasi untuk sebuah perangkat di Pengaturan → Umum untuk mendapat kabar tentang undangan, pengingat kesehatan, dan setiap dosis obat, bahkan saat aplikasi ditutup. Semua orang yang diajak berbagi sebuah catatan kesehatan mendapat pengingatnya. Teksnya dienkripsi untuk setiap perangkat Anda, sehingga kami pun tidak bisa membacanya, dan Anda bisa menyembunyikan judul dari layar kunci.',
        },
      },
    ],
  },
  {
    date: '2026-10-18',
    title: {
      en: 'Notifications in one place',
      id: 'Semua notifikasi di satu tempat',
    },
    changes: [
      {
        kind: 'new',
        text: {
          en: 'A bell next to search shows what needs you: invitations to accept or decline, health reminders that are due, encrypted items someone you share with can’t read, and when a newer version of the app is ready. Each one leaves the list once it’s dealt with.',
          id: 'Lonceng di samping pencarian menampilkan yang perlu Anda tindak lanjuti: undangan untuk diterima atau ditolak, pengingat kesehatan yang jatuh tempo, item terenkripsi yang tidak bisa dibaca orang yang Anda bagikan, dan saat versi aplikasi yang lebih baru tersedia. Masing-masing hilang dari daftar setelah ditangani.',
        },
      },
      {
        kind: 'improved',
        text: {
          en: 'Each list now shows only its own invitations: notes on Notes, books on Finances, and so on. All of them are still under the bell.',
          id: 'Setiap daftar kini hanya menampilkan undangannya sendiri: catatan di Catatan, buku di Keuangan, dan seterusnya. Semuanya tetap ada di lonceng.',
        },
      },
      {
        kind: 'new',
        text: {
          en: 'After an update, the bell tells you what’s new, once, on all your devices.',
          id: 'Setelah pembaruan, lonceng memberi tahu apa yang baru, sekali saja, di semua perangkat Anda.',
        },
      },
      {
        kind: 'fixed',
        text: {
          en: 'Pressing Backspace in an empty note now moves you to the end of the title, so you can keep typing where you left off.',
          id: 'Menekan Backspace di catatan yang kosong kini membawa Anda ke akhir judul, sehingga Anda bisa lanjut mengetik dari sana.',
        },
      },
    ],
  },
  {
    date: '2026-10-17',
    title: {
      en: 'A tidier period summary',
      id: 'Ringkasan menstruasi yang lebih rapi',
    },
    changes: [
      {
        kind: 'improved',
        text: {
          en: 'The period summary says each thing once: the next period shows its expected days, the averages sit under the cycle bar, and the colours are explained only under the calendar. A period without a logged last day reads “About 6 days” once that time has passed, not “Ongoing”.',
          id: 'Ringkasan menstruasi kini menyebut tiap hal sekali: menstruasi berikutnya menampilkan perkiraan harinya, rata-rata ada di bawah bilah siklus, dan warna hanya dijelaskan di bawah kalender. Menstruasi tanpa hari terakhir kini tertulis “Sekitar 6 hari” setelah waktunya lewat, bukan “Sedang berlangsung”.',
        },
      },
      {
        kind: 'fixed',
        text: {
          en: 'On a phone, touching and holding in a note selects text again, with your phone’s own copy and paste menu. The formatting menu no longer covers it; format from the Format button at the top instead.',
          id: 'Di ponsel, sentuh dan tahan di catatan kembali memilih teks, dengan menu salin dan tempel bawaan ponsel. Menu format tidak lagi menutupinya; gunakan tombol Format di atas untuk memformat.',
        },
      },
      {
        kind: 'fixed',
        text: {
          en: 'On iPhone and iPad, selected text in a note shows its handles again, so you can drag the start and end of what you selected. Selected text is also easier to see, in both light and dark mode.',
          id: 'Di iPhone dan iPad, teks yang dipilih di catatan kembali menampilkan penanda awal dan akhirnya, jadi Anda bisa menggeser pilihan. Teks yang dipilih juga lebih mudah terlihat, di mode terang maupun gelap.',
        },
      },
      {
        kind: 'fixed',
        text: {
          en: 'On iPhones with iOS 17, the New note, New task, New book and New health log buttons show again above the bottom bar.',
          id: 'Di iPhone dengan iOS 17, tombol Catatan baru, Tugas baru, Buku baru, dan Catatan kesehatan baru kembali tampil di atas bilah bawah.',
        },
      },
    ],
  },
  {
    date: '2026-10-16',
    title: {
      en: 'A simpler period calendar',
      id: 'Kalender menstruasi yang lebih sederhana',
    },
    changes: [
      {
        kind: 'improved',
        text: {
          en: 'The period calendar has a Today button that brings you back to this month, and no longer marks a separate ovulation window: the fertile window and the likely ovulation day are shown as before.',
          id: 'Kalender menstruasi kini punya tombol Hari ini untuk kembali ke bulan ini, dan tidak lagi menandai masa ovulasi tersendiri: masa subur dan perkiraan hari ovulasi tetap ditampilkan.',
        },
      },
      {
        kind: 'improved',
        text: {
          en: 'Changing a birth date already set in a health log now asks you to confirm first, so it can’t change by accident.',
          id: 'Mengubah tanggal lahir yang sudah diisi di catatan kesehatan kini meminta konfirmasi dulu, supaya tidak berubah tanpa sengaja.',
        },
      },
      {
        kind: 'improved',
        text: {
          en: 'A health log’s sex can’t be changed while it has logged periods or a period reminder, so they aren’t hidden by accident.',
          id: 'Jenis kelamin di catatan kesehatan tidak bisa diubah selama ada catatan atau pengingat menstruasi, supaya tidak tersembunyi tanpa sengaja.',
        },
      },
      {
        kind: 'fixed',
        text: {
          en: 'Tapping the day right after a period now continues that period instead of starting a new one.',
          id: 'Mengetuk hari tepat setelah menstruasi kini melanjutkan menstruasi itu, bukan memulai yang baru.',
        },
      },
      {
        kind: 'improved',
        text: {
          en: 'The period summary and your logged periods now share one card beside the calendar: the summary on top, and the history below it scrolling on its own.',
          id: 'Ringkasan menstruasi dan daftar menstruasi yang kamu catat kini ada dalam satu kartu di samping kalender: ringkasan di atas, dan riwayat di bawahnya bisa digulir sendiri.',
        },
      },
      {
        kind: 'improved',
        text: {
          en: 'The period summary is more compact: a bar shows where you are in your cycle and when the fertile window falls, and each date has the colour it has on the calendar.',
          id: 'Ringkasan menstruasi kini lebih ringkas: sebuah bar menunjukkan posisimu dalam siklus dan kapan masa subur, dan setiap tanggal memakai warna yang sama dengan di kalender.',
        },
      },
      {
        kind: 'new',
        text: {
          en: 'An Add period button logs a period without finding its day on the calendar.',
          id: 'Tombol Tambah menstruasi mencatat menstruasi tanpa perlu mencari tanggalnya di kalender.',
        },
      },
      {
        kind: 'improved',
        text: {
          en: 'All hints and chart readouts now share one look, and the hint on a locked sex shows on tap too.',
          id: 'Semua petunjuk dan keterangan grafik kini tampil seragam, dan petunjuk jenis kelamin yang terkunci juga muncul saat diketuk.',
        },
      },
    ],
  },
  {
    date: '2026-10-16',
    title: {
      en: 'Task lists from pasted text',
      id: 'Daftar tugas dari teks tempelan',
    },
    changes: [
      {
        kind: 'new',
        text: {
          en: 'In a task list, the Gemini menu can now make items from text you paste, such as a list copied from another note. It picks out the things to do and the title, and shows them for you to check before they are added.',
          id: 'Di daftar tugas, menu Gemini kini bisa membuat item dari teks yang kamu tempel, misalnya daftar yang disalin dari catatan lain. Gemini memilih hal yang perlu dikerjakan dan judulnya, lalu menampilkannya untuk kamu periksa sebelum ditambahkan.',
        },
      },
    ],
  },
  {
    date: '2026-10-16',
    title: {
      en: 'A calendar for periods',
      id: 'Kalender menstruasi',
    },
    changes: [
      {
        kind: 'new',
        text: {
          en: 'Periods in a health log now show on a calendar: the days you logged, and ahead of today the expected period, the other days it could start on, the fertile window, the ovulation window and the likely ovulation day. The summary below it lists the same dates for the next cycle, and on wider screens your logged periods sit beside it, scrolling within its height.',
          id: 'Menstruasi di catatan kesehatan kini tampil di kalender: hari-hari yang kamu catat, dan setelah hari ini perkiraan menstruasi, hari lain yang mungkin menjadi awalnya, masa subur, masa ovulasi dan perkiraan hari ovulasi. Ringkasan di bawahnya mencantumkan tanggal yang sama untuk siklus berikutnya, dan di layar yang lebih lebar daftar menstruasi yang kamu catat ada di sampingnya, bisa digulir setinggi kalender.',
        },
      },
      {
        kind: 'improved',
        text: {
          en: 'Log a period by tapping a day on the calendar: when it started, its flow and notes, and the day it ended, which can make it longer or shorter. Until you log the last day, the period follows its expected length.',
          id: 'Catat menstruasi dengan mengetuk tanggal di kalender: kapan mulainya, banyaknya darah dan catatan, serta hari berakhirnya, yang bisa membuatnya lebih panjang atau pendek. Selama hari terakhir belum dicatat, lamanya mengikuti perkiraan.',
        },
      },
      {
        kind: 'improved',
        text: {
          en: 'The overview shows where you are in your cycle today: which day of your period, ovulation or the fertile window, or when the next period is due.',
          id: 'Ringkasan kini menunjukkan posisimu dalam siklus hari ini: hari ke berapa menstruasi, ovulasi atau masa subur, atau kapan menstruasi berikutnya.',
        },
      },
    ],
  },
  {
    date: '2026-10-15',
    title: {
      en: 'Safer task creation',
      id: 'Pembuatan tugas yang lebih aman',
    },
    changes: [
      {
        kind: 'improved',
        text: {
          en: 'In a note, the Format button sits in the bar at the top. Press it to show a second row of buttons for bold, code, links, headings and lists, which stays in reach while you scroll. The formats used where the cursor is light up, here and in the right-click menu.',
          id: 'Di catatan, tombol Format ada di bilah atas. Tekan untuk menampilkan baris tombol kedua untuk tebal, kode, tautan, judul dan daftar, yang tetap terjangkau saat kamu menggulir. Format yang dipakai di posisi kursor menyala, di sini dan di menu klik kanan.',
        },
      },
      {
        kind: 'new',
        text: {
          en: 'Dictate notes: choose Gemini, then Dictate, and speak in any language. You check the text before it is added to the note.',
          id: 'Dikte catatan: pilih Gemini, lalu Dikte, dan bicaralah dalam bahasa apa pun. Kamu memeriksa teksnya sebelum ditambahkan ke catatan.',
        },
      },
      {
        kind: 'new',
        text: {
          en: 'Gemini in task lists: dictate items, break open items into steps, get suggestions for what is missing, or translate the list. You check the result before it changes the list, and can undo it.',
          id: 'Gemini di daftar tugas: dikte item, pecah item yang belum selesai jadi langkah, dapatkan saran item yang terlewat, atau terjemahkan daftarnya. Kamu memeriksa hasilnya sebelum daftar diubah, dan bisa mengurungkannya.',
        },
      },
      {
        kind: 'improved',
        text: {
          en: 'The calendar opens as soon as you click or move into a date field, and you can still type the date.',
          id: 'Kalender langsung terbuka saat kamu mengklik atau masuk ke kolom tanggal, dan kamu tetap bisa mengetik tanggalnya.',
        },
      },
      {
        kind: 'fixed',
        text: {
          en: 'In a finance book, the small balance bar appears only once the whole summary card has scrolled away, rising in as you scroll, and the page no longer jumps when it does.',
          id: 'Di buku keuangan, bilah saldo kecil baru muncul setelah seluruh kartu ringkasan tergulir keluar, naik perlahan mengikuti guliran, dan halaman tidak lagi melompat saat itu terjadi.',
        },
      },
      {
        kind: 'fixed',
        text: {
          en: 'When dictation fails, the message now says why (no speech heard, or no microphone) instead of a general error.',
          id: 'Saat dikte gagal, pesannya kini menyebutkan penyebabnya (tidak ada suara terdengar, atau tidak ada mikrofon), bukan galat umum.',
        },
      },
      {
        kind: 'new',
        text: {
          en: 'Format notes with labeled buttons: choose Format, right-click, or touch and hold for bold, italic, headings and lists.',
          id: 'Format catatan dengan tombol berlabel: pilih Format, klik kanan, atau sentuh dan tahan untuk teks tebal, miring, judul dan daftar.',
        },
      },
      {
        kind: 'improved',
        text: {
          en: 'While Gemini works on a note, a message at the bottom says what it is doing.',
          id: 'Saat Gemini memproses catatan, pesan di bagian bawah menunjukkan apa yang sedang dikerjakan.',
        },
      },
      {
        kind: 'fixed',
        text: {
          en: 'Inline code in note previews no longer shows extra backticks.',
          id: 'Kode sebaris pada pratinjau catatan tidak lagi menampilkan tanda backtick tambahan.',
        },
      },
      {
        kind: 'improved',
        text: {
          en: 'Notes have a more comfortable writing area, tips for getting started, and keyboard saving with ⌘S or Ctrl+S. Notes without a title are easier to spot in the list.',
          id: 'Catatan kini memiliki area menulis yang lebih nyaman, petunjuk untuk mulai menulis, dan pintasan simpan ⌘S atau Ctrl+S. Catatan tanpa judul lebih mudah ditemukan di daftar.',
        },
      },
      {
        kind: 'improved',
        text: {
          en: 'Public pages now make fewer script requests when opening.',
          id: 'Halaman publik kini memuat lebih sedikit berkas skrip saat dibuka.',
        },
      },
      {
        kind: 'improved',
        text: {
          en: 'Tap a task item’s text or pencil to edit it. On phones too, tapping the text focuses the input and places the cursor near the tapped position. Dragging stays on the grip button.',
          id: 'Ketuk teks item tugas atau pensilnya untuk mengedit. Di ponsel juga, mengetuk teks langsung memfokuskan kolom dan menempatkan kursor di dekat titik yang diketuk. Gunakan tombol pegangan untuk menyeret.',
        },
      },
      {
        kind: 'improved',
        text: {
          en: 'Task text, checkboxes and drag handles now line up vertically in each row.',
          id: 'Teks tugas, kotak centang, dan pegangan untuk menyeret kini sejajar secara vertikal dalam setiap baris.',
        },
      },
      {
        kind: 'improved',
        text: {
          en: 'The add-item field lines up with the item text and editing fields. On phones, the Add button sits below it to give you more typing space.',
          id: 'Kolom tambah item sejajar dengan teks item dan kolom pengeditan. Di ponsel, tombol Tambah berada di bawahnya agar ruang mengetik lebih luas.',
        },
      },
      {
        kind: 'improved',
        text: {
          en: 'Dragging a task item now shows a line where it will land before you release it.',
          id: 'Saat menyeret item tugas, kini muncul garis tempat item akan diletakkan sebelum dilepas.',
        },
      },
      {
        kind: 'improved',
        text: {
          en: 'Arrow Up now keeps your cursor column when moving to the previous task item, just like Arrow Down.',
          id: 'Panah Atas kini mempertahankan kolom kursor saat berpindah ke item tugas sebelumnya, seperti Panah Bawah.',
        },
      },
      {
        kind: 'fixed',
        text: {
          en: 'New task lists stay locked until the saved list opens, so typing immediately after Save cannot be lost.',
          id: 'Daftar tugas baru tetap terkunci hingga daftar yang disimpan terbuka, agar teks yang langsung diketik setelah Simpan tidak hilang.',
        },
      },
    ],
  },
  {
    date: '2026-10-14',
    title: {
      en: 'A clearer account check',
      id: 'Cek akun yang lebih jelas',
    },
    changes: [
      {
        kind: 'improved',
        text: {
          en: 'Hold and drag the grip to arrange task items, or delete all completed items with undo. Tap the pencil to edit. Adding and editing use matching fields, and keyboard navigation keeps your cursor position. Unfinished text is kept when you save or leave.',
          id: 'Tekan lama lalu seret pegangan untuk mengurutkan tugas, atau hapus semua item yang selesai dengan pilihan urungkan. Ketuk pensil untuk mengedit. Kolom menambah dan mengedit kini seragam, dan navigasi papan ketik mempertahankan posisi kursor. Teks yang belum ditambahkan tetap disimpan saat menyimpan atau keluar.',
        },
      },
      {
        kind: 'improved',
        text: {
          en: 'Quick add and receipt scanning now share one Gemini button with the same sparkle icon as notes. Type or scan inside one card, then check the entries before adding them.',
          id: 'Tambah cepat dan pindai struk kini ada dalam satu tombol Gemini dengan ikon bintang seperti di catatan. Ketik atau pindai dalam satu kartu, lalu periksa entri sebelum menambahkannya.',
        },
      },
      {
        kind: 'improved',
        text: {
          en: 'Type dates directly, with automatic separators and English or Indonesian month names, or use the calendar. Dates start in DD-MM-YYYY format; choose another format in Settings → General.',
          id: 'Ketik tanggal langsung dengan pemisah otomatis dan nama bulan dalam bahasa Inggris atau Indonesia, atau gunakan kalender. Format awal tanggal adalah DD-MM-YYYY; pilih format lain di Pengaturan → Umum.',
        },
      },
      {
        kind: 'improved',
        text: {
          en: 'The quantity field now follows the amount when adding or editing a finance entry.',
          id: 'Kolom jumlah kini berada setelah nominal saat menambah atau mengedit entri keuangan.',
        },
      },
      {
        kind: 'improved',
        text: {
          en: 'The expenses and income switch sits above both breakdown cards, making it clearer that it changes categories and items together.',
          id: 'Pilihan pengeluaran dan pemasukan berada di atas kedua kartu rincian, sehingga lebih jelas bahwa kategori dan item berubah bersama.',
        },
      },
      {
        kind: 'fixed',
        text: {
          en: 'Chart tooltips show full labels and give amounts more room, making large numbers easier to read.',
          id: 'Tooltip grafik menampilkan label lengkap dan memberi lebih banyak ruang untuk jumlah, sehingga angka besar lebih mudah dibaca.',
        },
      },
      {
        kind: 'fixed',
        text: {
          en: 'The difference between your accounts and a book now shows which way it goes: more in your accounts in green, less in orange, and a check mark when they match. Before, both were red.',
          id: 'Selisih antara akunmu dan buku kini menunjukkan arahnya: lebih banyak di akunmu berwarna hijau, lebih sedikit berwarna oranye, dan tanda centang saat cocok. Sebelumnya keduanya merah.',
        },
      },
      {
        kind: 'improved',
        text: {
          en: 'The cash flow chart stays readable when one day is far bigger than the rest, such as payday: that column is cut off with its amount written on it, so the other days are no longer flattened.',
          id: 'Grafik arus kas tetap mudah dibaca saat satu hari jauh lebih besar dari yang lain, misalnya hari gajian: kolom itu dipotong dengan jumlahnya tertulis, jadi hari-hari lain tidak lagi rata.',
        },
      },
      {
        kind: 'fixed',
        text: {
          en: 'A change made just before leaving a finance book is no longer refused.',
          id: 'Perubahan yang dibuat tepat sebelum meninggalkan buku keuangan tidak lagi ditolak.',
        },
      },
    ],
  },
  {
    date: '2026-10-13',
    title: {
      en: 'Account emails in your language',
      id: 'Email akun dalam bahasamu',
    },
    changes: [
      {
        kind: 'improved',
        text: {
          en: 'The home page and the guide open faster: they no longer download the parts of the app that only work after signing in.',
          id: 'Halaman depan dan panduan terbuka lebih cepat: keduanya tidak lagi mengunduh bagian aplikasi yang hanya dipakai setelah masuk.',
        },
      },
      {
        kind: 'improved',
        text: {
          en: 'Finance books no longer fill up: keep adding entries for as long as you like, and saving stays quick in big books, since only the month you changed is saved. Each book switches over by itself the first time someone who can edit it opens it.',
          id: 'Buku keuangan tidak lagi bisa penuh: tambahkan entri sebanyak yang kamu mau, dan menyimpan tetap cepat di buku besar, karena hanya bulan yang diubah yang disimpan. Tiap buku beralih dengan sendirinya saat pertama kali dibuka oleh orang yang bisa mengubahnya.',
        },
      },
      {
        kind: 'improved',
        text: {
          en: 'With end-to-end encryption, long lists keep up: when one item changes, only that item is unlocked again, not the whole list.',
          id: 'Dengan enkripsi end-to-end, daftar yang panjang tetap cepat: saat satu item berubah, hanya item itu yang dibuka lagi, bukan seluruh daftar.',
        },
      },
      {
        kind: 'improved',
        text: {
          en: 'Nothing typed is lost so easily: a new entry or Quick add text you haven’t saved comes back when you open the book again (for an encrypted book, while the tab stays open), and what you save offline now uploads when you’re back online, even after closing or reloading the tab.',
          id: 'Yang sudah diketik tidak gampang hilang: entri baru atau teks Tambah cepat yang belum disimpan muncul lagi saat kamu membuka bukunya (untuk buku terenkripsi, selama tab masih terbuka), dan yang kamu simpan saat offline kini terkirim begitu online lagi, bahkan setelah tab ditutup atau dimuat ulang.',
        },
      },
      {
        kind: 'new',
        text: {
          en: 'Archive: tidy your lists without deleting anything. An archived note, list, book or health log moves to Archived at the bottom of its list, only for you, and comes back with one tap.',
          id: 'Arsip: rapikan daftarmu tanpa menghapus apa pun. Catatan, daftar, buku, atau log kesehatan yang diarsipkan pindah ke Arsip di bawah daftarnya, hanya untukmu, dan bisa dikembalikan dengan sekali ketuk.',
        },
      },
      {
        kind: 'new',
        text: {
          en: 'Block: if someone keeps inviting you, block them from their invitation and they can’t invite you any more, without being told. Unblock them in Settings → Account.',
          id: 'Blokir: jika seseorang terus mengundangmu, blokir dari undangannya dan mereka tidak bisa mengundangmu lagi, tanpa diberi tahu. Buka blokir di Pengaturan → Akun.',
        },
      },
      {
        kind: 'fixed',
        text: {
          en: 'Sharing says when nobody uses Catat Saja with that email, instead of getting stuck; invitations no longer hide behind the create button on a computer.',
          id: 'Berbagi kini memberi tahu jika tidak ada yang memakai Catat Saja dengan email itu, tidak lagi macet; undangan tidak lagi tertutup tombol buat di komputer.',
        },
      },
      {
        kind: 'new',
        text: {
          en: 'Sharing is now an invitation: the other person sees it at the top of the app and accepts or declines, and nothing joins their lists until they accept. Everything already shared stays shared.',
          id: 'Berbagi kini berupa undangan: orang yang diajak melihatnya di bagian atas aplikasi lalu menerima atau menolak, dan tidak ada yang masuk ke daftarnya sebelum diterima. Semua yang sudah dibagikan tetap dibagikan.',
        },
      },
      {
        kind: 'new',
        text: {
          en: 'Analysis by item: things you bought more than once, grouped by name even when written differently (telur, Telur 1kg, TELUR), with how often, the average price and whether the latest price went up or down.',
          id: 'Analisis per item: yang kamu beli lebih dari sekali, dikelompokkan menurut nama walau ditulis berbeda (telur, Telur 1kg, TELUR), lengkap dengan berapa kali, harga rata-rata, dan apakah harga terakhir naik atau turun.',
        },
      },
      {
        kind: 'fixed',
        text: {
          en: 'The finance charts shrink to fit when the window gets narrower, instead of making the page scroll sideways.',
          id: 'Grafik keuangan kini menyesuaikan saat jendela menyempit, tidak lagi membuat halaman bergeser ke samping.',
        },
      },
      {
        kind: 'new',
        text: {
          en: 'Encryption is now your choice when you sign up: set it up right away, or continue without it and turn it on later in Settings → Account → Security.',
          id: 'Enkripsi kini pilihanmu saat mendaftar: siapkan langsung, atau lanjut tanpa enkripsi dan aktifkan nanti di Pengaturan → Akun → Keamanan.',
        },
      },
      {
        kind: 'new',
        text: {
          en: 'When sharing, the people you already share with are suggested under the email field; tap one instead of typing their email.',
          id: 'Saat berbagi, orang yang sudah sering kamu ajak berbagi muncul sebagai saran di bawah kolom email; ketuk salah satunya tanpa perlu mengetik emailnya.',
        },
      },
      {
        kind: 'improved',
        text: {
          en: 'The browser tab shows where you are: the note, list, book or health log you have open, or the page’s name.',
          id: 'Tab browser menunjukkan posisimu: catatan, daftar, buku, atau log kesehatan yang sedang dibuka, atau nama halamannya.',
        },
      },
      {
        kind: 'improved',
        text: {
          en: 'In a book, the Add entry, scan and Quick add buttons stay at the top as you scroll, and the Quick add form floats like the entry form.',
          id: 'Di buku, tombol Tambah entri, pindai, dan Tambah cepat tetap di atas saat menggulir, dan formulir Tambah cepat melayang seperti formulir entri.',
        },
      },
      {
        kind: 'fixed',
        text: {
          en: 'A calculation in an amount (such as 10 000+11 900) now groups every number the same way as you type, and Save or Cancel works with one tap right after it.',
          id: 'Hitungan di kolom nominal (seperti 10.000+11.900) kini mengelompokkan setiap angka dengan cara yang sama saat diketik, dan Simpan atau Batal langsung bisa diketuk sekali setelahnya.',
        },
      },
      {
        kind: 'fixed',
        text: {
          en: 'A book’s card shows its latest entries by date, not the last ones you typed in.',
          id: 'Kartu buku menampilkan entri terbaru menurut tanggal, bukan yang terakhir kamu ketik.',
        },
      },
      {
        kind: 'fixed',
        text: {
          en: 'The button next to the email field when sharing now says what it does: find this person.',
          id: 'Tombol di samping kolom email saat berbagi kini menjelaskan fungsinya: cari orang ini.',
        },
      },
      {
        kind: 'improved',
        text: {
          en: 'A redrawn app icon: a glass notepad and a glossy pencil, sharp at every size and filling the whole icon on your home screen. In the app and the browser tab it follows your theme: dark on the light theme, light on the dark theme.',
          id: 'Ikon aplikasi digambar ulang: buku catatan kaca dan pensil mengilap, tajam di semua ukuran dan memenuhi seluruh ikon di layar utama. Di aplikasi dan tab browser, ikonnya mengikuti temamu: gelap di tema terang, terang di tema gelap.',
        },
      },
      {
        kind: 'improved',
        text: {
          en: 'In a book, the balance and its difference from your accounts stay at the top in a compact bar as you scroll. The form for adding entries floats below it, more compact and slightly see-through, so you can check the entries and whether the book matches while you type.',
          id: 'Di buku, saldo dan selisihnya dengan akunmu tetap di atas dalam bilah ringkas saat kamu menggulir. Formulir tambah entri melayang di bawahnya, lebih ringkas dan sedikit tembus pandang, jadi kamu bisa memeriksa entri dan apakah bukunya sudah cocok sambil mengetik.',
        },
      },
      {
        kind: 'improved',
        text: {
          en: 'Emails to verify your address, reset your password or confirm a new email now come in the language you use the app in.',
          id: 'Email untuk memverifikasi alamat, mengatur ulang kata sandi, atau mengonfirmasi email baru kini dikirim dalam bahasa yang kamu pakai di aplikasi.',
        },
      },
      {
        kind: 'fixed',
        text: {
          en: 'Signing in with Google when your email already has an account with a password now tells you what to do: sign in with your password, then link Google in Settings → Account.',
          id: 'Masuk dengan Google saat email-mu sudah punya akun dengan kata sandi kini memberi tahu langkahnya: masuk dengan kata sandi, lalu hubungkan Google di Pengaturan → Akun.',
        },
      },
      {
        kind: 'fixed',
        text: {
          en: '“Forgot password” no longer says an email was sent when no account uses that address; it now says a link was sent if one does.',
          id: '“Lupa kata sandi” tidak lagi menyatakan email terkirim padahal tidak ada akun dengan alamat itu; kini tertulis tautan dikirim jika akunnya ada.',
        },
      },
      {
        kind: 'fixed',
        text: {
          en: 'With a note, task list, book or health log open on two devices, something deleted on one no longer comes back from the other. Entries, measurements and reminders added on both at once are all kept.',
          id: 'Saat catatan, daftar tugas, buku, atau log kesehatan terbuka di dua perangkat, yang dihapus di satu perangkat tidak lagi muncul kembali dari perangkat lain. Entri, pengukuran, dan pengingat yang ditambahkan di keduanya bersamaan kini tersimpan semua.',
        },
      },
      {
        kind: 'fixed',
        text: {
          en: 'In a book, Quick add stays next to Add entry while a receipt is being read or checked.',
          id: 'Di buku, Tambah cepat tetap di samping Tambah entri saat struk sedang dibaca atau diperiksa.',
        },
      },
      {
        kind: 'improved',
        text: {
          en: 'The stories on the home page now play the same way in both languages: each person’s part of the full video, in a wide player.',
          id: 'Cerita di halaman utama kini diputar dengan cara yang sama di kedua bahasa: bagian tiap orang dari video lengkap, di pemutar lebar.',
        },
      },
      {
        kind: 'fixed',
        text: {
          en: 'A book’s currency is easy to read again when it can’t be changed: it shows as text, and tapping it says why.',
          id: 'Mata uang buku kembali mudah dibaca saat tidak bisa diubah: ditampilkan sebagai teks, dan saat diketuk muncul alasannya.',
        },
      },
    ],
  },
  {
    date: '2026-10-12',
    title: {
      en: 'A guide to the app',
      id: 'Panduan aplikasi',
    },
    changes: [
      {
        kind: 'new',
        text: {
          en: 'How to use: a page that explains each feature and where to find it, from notes and tasks to finances, health, sharing, encryption and Gemini. Open it from the account menu or the links at the bottom of the page.',
          id: 'Cara pakai: halaman yang menjelaskan setiap fitur dan tempat menemukannya, dari catatan dan tugas sampai keuangan, kesehatan, berbagi, enkripsi, dan Gemini. Buka dari menu akun atau tautan di bagian bawah halaman.',
        },
      },
      {
        kind: 'new',
        text: {
          en: 'The home page tells four short stories of people using Catat Saja, from a new mum to a freelancer abroad. Choose one to watch it; nothing loads from YouTube until you do.',
          id: 'Halaman utama kini punya empat cerita singkat orang yang memakai Catat Saja, dari ibu baru sampai pekerja lepas di luar negeri. Pilih salah satu untuk menontonnya; tidak ada yang dimuat dari YouTube sebelum kamu memilih.',
        },
      },
      {
        kind: 'improved',
        text: {
          en: 'The guide shows each part of the app it talks about, such as the buttons, the icon bar and the menus, so they are easy to find.',
          id: 'Panduan menampilkan setiap bagian aplikasi yang dibahasnya, seperti tombol, bilah ikon, dan menu, agar mudah ditemukan.',
        },
      },
    ],
  },
  {
    date: '2026-10-12',
    title: {
      en: 'Gemini helpers, health reminders and growth to 19',
      id: 'Bantuan Gemini, pengingat kesehatan, dan tumbuh kembang sampai 19 tahun',
    },
    changes: [
      {
        kind: 'new',
        text: {
          en: 'Undo and redo in the icon bar of notes, task lists, finance books and health logs, for everything in them (including Gemini’s changes). In notes, the Gemini menu has moved to the icon bar too.',
          id: 'Urungkan dan ulangi di bilah ikon catatan, daftar tugas, buku keuangan, dan catatan kesehatan, untuk semua isinya (termasuk perubahan dari Gemini). Di catatan, menu Gemini kini juga ada di bilah ikon.',
        },
      },
      {
        kind: 'improved',
        text: {
          en: 'Child growth follows Kemenkes PMK No. 2/2020 more closely: BMI results use its terms (gizi baik, berisiko gizi lebih), and weight for ages 5 to 10 shows its percentile without a status, as neither Kemenkes nor WHO classifies weight alone at that age.',
          id: 'Tumbuh kembang anak kini lebih sesuai dengan PMK No. 2/2020: hasil IMT memakai istilahnya (gizi baik, berisiko gizi lebih), dan berat badan usia 5 sampai 10 tahun hanya menampilkan persentil tanpa status, karena Kemenkes maupun WHO tidak mengklasifikasikan berat badan saja di usia itu.',
        },
      },
      {
        kind: 'new',
        text: {
          en: 'Quick add in finance books: type what you paid or received, like “lunch 45rb, parking 5rb yesterday, salary 8jt”, check the entries Gemini reads from it, and add the ones you want.',
          id: 'Tambah cepat di buku keuangan: ketik apa yang kamu bayar atau terima, misalnya “makan siang 45rb, parkir 5rb kemarin, gaji 8jt”, periksa entri yang dibaca Gemini, lalu tambahkan yang kamu mau.',
        },
      },
      {
        kind: 'new',
        text: {
          en: 'Gemini helpers for notes: summarise, tidy up, translate between English and Indonesian, or turn a note into a task list. You see the result first, and changes can be undone.',
          id: 'Bantuan Gemini untuk catatan: ringkas, rapikan, terjemahkan antara bahasa Inggris dan Indonesia, atau jadikan catatan daftar tugas. Hasilnya ditampilkan dulu, dan perubahannya bisa dibatalkan.',
        },
      },
      {
        kind: 'new',
        text: {
          en: 'Health reminders: be reminded to weigh, check blood sugar and more every few days, or before an expected period. Due reminders show on the log, its card and the Health menu, and each can be added to your phone’s calendar to alert on time.',
          id: 'Pengingat kesehatan: diingatkan untuk menimbang, cek gula darah, dan lainnya setiap beberapa hari, atau sebelum perkiraan haid. Pengingat yang jatuh tempo muncul di catatan, kartunya, dan menu Kesehatan, dan masing-masing bisa ditambahkan ke kalender HP agar ada notifikasi tepat waktu.',
        },
      },
      {
        kind: 'improved',
        text: {
          en: 'You can take back your agreement to use Gemini in Settings → Account; you’ll be asked again before an AI feature next sends anything.',
          id: 'Persetujuan memakai Gemini bisa dibatalkan di Pengaturan → Akun; kamu akan ditanya lagi sebelum fitur AI mengirim sesuatu.',
        },
      },
      {
        kind: 'fixed',
        text: {
          en: 'The “Opens on” choices in Settings fill whole rows.',
          id: 'Pilihan “Dibuka di” di Pengaturan kini mengisi baris dengan rapi.',
        },
      },
      {
        kind: 'new',
        text: {
          en: 'Child growth now goes up to 19 years: from 5, height and BMI are compared with the WHO Growth Reference for school-age children and adolescents, with percentiles and the Kemenkes status for BMI. Weight for age goes up to 10 years, as far as WHO publishes it.',
          id: 'Tumbuh kembang anak kini sampai usia 19 tahun: mulai 5 tahun, tinggi badan dan IMT dibandingkan dengan Referensi Pertumbuhan WHO untuk anak usia sekolah dan remaja, lengkap dengan persentil dan status Kemenkes untuk IMT. Berat badan menurut umur tersedia sampai usia 10 tahun, sejauh yang diterbitkan WHO.',
        },
      },
      {
        kind: 'improved',
        text: {
          en: 'When checking a scanned receipt you can change its date. You’re told when the receipt has no readable date, when it is over a month old, or when a date that hasn’t come yet was taken as day and month swapped.',
          id: 'Saat memeriksa struk yang dipindai, tanggalnya bisa diubah. Kamu diberi tahu jika struk tidak punya tanggal yang terbaca, sudah lebih dari sebulan, atau tanggal yang belum terjadi dianggap tertukar hari dan bulannya.',
        },
      },
      {
        kind: 'improved',
        text: {
          en: 'Scanning a receipt takes each discount off the item it was printed under, and spreads only a discount on the whole bill over all items. The review shows each item’s discount and the receipt’s total discount.',
          id: 'Saat memindai struk, setiap diskon kini dipotong dari barang yang tertulis di atasnya, dan hanya diskon untuk seluruh tagihan yang dibagi ke semua barang. Pemeriksaan struk menampilkan diskon tiap barang dan total diskonnya.',
        },
      },
    ],
  },
  {
    date: '2026-10-11',
    title: { en: 'End-to-end encryption', id: 'Enkripsi end-to-end' },
    changes: [
      {
        kind: 'new',
        text: {
          en: 'Scan a receipt into a finance book: take or choose a photo, check what was read, and add it as one entry or one per item, choosing which items to keep. The photo is read by Google’s Gemini, and only when you choose one.',
          id: 'Pindai struk ke buku keuangan: ambil atau pilih foto, periksa hasil bacaannya, lalu tambahkan sebagai satu entri atau per barang, dengan memilih barang mana yang disimpan. Foto dibaca oleh Gemini milik Google, dan hanya saat kamu memilihnya.',
        },
      },
      {
        kind: 'new',
        text: {
          en: 'The home page has a one-minute video showing the app. It loads from YouTube only when you press play.',
          id: 'Halaman utama kini punya video satu menit yang memperlihatkan aplikasi. Video baru dimuat dari YouTube saat kamu menekan putar.',
        },
      },
      {
        kind: 'improved',
        text: {
          en: 'A friendlier page when a link leads nowhere, with buttons to go back or return to the app.',
          id: 'Halaman yang lebih ramah saat tautan tidak ditemukan, dengan tombol untuk kembali atau ke aplikasi.',
        },
      },
      {
        kind: 'fixed',
        text: {
          en: 'The settings tabs fit on phone screens.',
          id: 'Tab pengaturan kini muat di layar HP.',
        },
      },
      {
        kind: 'improved',
        text: {
          en: 'The About page explains what the app does, how it keeps your data private, and who makes it, with a link to their website.',
          id: 'Halaman Tentang aplikasi kini menjelaskan apa yang bisa dilakukan, bagaimana datamu dijaga tetap privat, dan siapa pembuatnya, dengan tautan ke situsnya.',
        },
      },
      {
        kind: 'improved',
        text: {
          en: 'Settings are regrouped: encryption sits with your email and sign-in under Account, and BMI and lab units have their own Health page.',
          id: 'Pengaturan dikelompokkan ulang: enkripsi kini bersama email dan cara masuk di Akun, dan IMT serta satuan lab punya halaman Kesehatan sendiri.',
        },
      },
      {
        kind: 'improved',
        text: {
          en: 'The example cards on the home page match the app as it is today, including a health log.',
          id: 'Contoh kartu di halaman utama kini sesuai dengan aplikasi saat ini, termasuk catatan kesehatan.',
        },
      },
      {
        kind: 'improved',
        text: {
          en: 'Smarter category suggestions: they recognise common shops, apps and words (like Grab, Indomaret or PLN) from your first entry, and learn from your own entries, all on your device.',
          id: 'Saran kategori lebih pintar: langsung mengenali toko, aplikasi, dan kata umum (seperti Grab, Indomaret, atau PLN) sejak entri pertama, dan belajar dari entri-entrimu sendiri, semuanya di perangkatmu.',
        },
      },
      {
        kind: 'improved',
        text: {
          en: 'The home page shows health logs and end-to-end encryption.',
          id: 'Halaman utama kini menampilkan catatan kesehatan dan enkripsi end-to-end.',
        },
      },
      {
        kind: 'new',
        text: {
          en: 'A Household category for expenses: appliances, houseware, furniture, tools and repairs.',
          id: 'Kategori Rumah tangga untuk pengeluaran: peralatan rumah tangga, perabot, elektronik rumah, perkakas, dan perbaikan.',
        },
      },
      {
        kind: 'improved',
        text: {
          en: 'Choose the month and year directly in the date picker, handy for birth dates.',
          id: 'Pilih bulan dan tahun langsung di pemilih tanggal, praktis untuk tanggal lahir.',
        },
      },
      {
        kind: 'improved',
        text: {
          en: 'Sex is colour-coded in health logs, and the expenses and income switch in the analysis matches the entry form.',
          id: 'Jenis kelamin kini diberi warna di catatan kesehatan, dan tombol pengeluaran dan pemasukan di analisis sama dengan formulir entri.',
        },
      },
      {
        kind: 'fixed',
        text: {
          en: 'Fields line up in the entry form and the health log header.',
          id: 'Kolom di formulir entri dan judul catatan kesehatan kini sejajar.',
        },
      },
      {
        kind: 'fixed',
        text: {
          en: 'The custom currency format fields line up, even when a label wraps.',
          id: 'Kolom format mata uang kustom kini sejajar, meski labelnya terbagi dua baris.',
        },
      },
      {
        kind: 'new',
        text: {
          en: 'End-to-end encryption: your notes, lists, books and health logs are encrypted on your device, so nobody else can read them, not even us. New accounts start with it; turn it on in Settings → Security.',
          id: 'Enkripsi end-to-end: catatan, daftar, buku, dan catatan kesehatanmu dienkripsi di perangkatmu, jadi tidak ada orang lain yang bisa membacanya, bahkan kami. Akun baru langsung memakainya; aktifkan di Pengaturan → Keamanan.',
        },
      },
      {
        kind: 'new',
        text: {
          en: 'Unlock with your passphrase or a passkey, keep a recovery code in case you forget, lock a device from the account menu, and turn encryption off again in Settings if you prefer.',
          id: 'Buka dengan frasa sandi atau passkey, simpan kode pemulihan jika lupa, kunci perangkat dari menu akun, dan nonaktifkan enkripsi lagi di Pengaturan jika kamu mau.',
        },
      },
      {
        kind: 'improved',
        text: {
          en: "Sharing works with everyone: items shared with people who haven't turned on encryption stay readable to them, and you're asked before anything is shared unencrypted.",
          id: 'Berbagi tetap berjalan untuk semua orang: item yang dibagikan dengan orang yang belum mengaktifkan enkripsi tetap bisa mereka baca, dan kamu ditanya dulu sebelum ada yang dibagikan tanpa enkripsi.',
        },
      },
    ],
  },
  {
    date: '2026-10-11',
    title: { en: 'Health', id: 'Kesehatan' },
    changes: [
      {
        kind: 'improved',
        text: {
          en: 'More privacy: other people can only find you by your exact email when sharing, and can no longer see a list of everyone.',
          id: 'Privasi lebih baik: orang lain hanya bisa menemukanmu dengan email yang persis saat berbagi, dan tidak bisa lagi melihat daftar semua pengguna.',
        },
      },
      {
        kind: 'fixed',
        text: {
          en: 'In the entry form, the currency lines up with the amount and the quantity with the date.',
          id: 'Di formulir entri, mata uang kini sejajar dengan nominal dan jumlah sejajar dengan tanggal.',
        },
      },
      {
        kind: 'new',
        text: {
          en: 'Health logs for you and your family: weight and BMI, child growth against the WHO standards, blood sugar, uric acid, cholesterol, calories and period estimates. Share a log like a note.',
          id: 'Catatan kesehatan untukmu dan keluarga: berat badan dan IMT, tumbuh kembang anak menurut standar WHO, gula darah, asam urat, kolesterol, kalori, dan perkiraan menstruasi. Bagikan catatan seperti catatan biasa.',
        },
      },
      {
        kind: 'new',
        text: {
          en: 'Choose the adult BMI categories (Kemenkes, WHO or Asia-Pacific) and the units for lab results in Settings.',
          id: 'Pilih kategori IMT dewasa (Kemenkes, WHO, atau Asia-Pasifik) dan satuan hasil laboratorium di Pengaturan.',
        },
      },
      {
        kind: 'new',
        text: {
          en: 'A Laundry category for expenses.',
          id: 'Kategori Laundry untuk pengeluaran.',
        },
      },
      {
        kind: 'improved',
        text: {
          en: 'Income is green and expenses orange everywhere: totals, entries, cards and the type switch.',
          id: 'Pemasukan berwarna hijau dan pengeluaran oranye di mana-mana: total, entri, kartu, dan tombol jenis.',
        },
      },
      {
        kind: 'fixed',
        text: {
          en: 'Category suggestions no longer switch an expense to income because of one shared word, such as a bank name.',
          id: 'Saran kategori tidak lagi mengubah pengeluaran menjadi pemasukan hanya karena satu kata yang sama, misalnya nama bank.',
        },
      },
      {
        kind: 'fixed',
        text: {
          en: 'Opening an existing book, note or list no longer jumps into its title, and the currency stays level with the amount while a calculation shows.',
          id: 'Membuka buku, catatan, atau daftar yang sudah ada tidak lagi langsung masuk ke judulnya, dan mata uang tetap sejajar dengan nominal saat hasil perhitungan tampil.',
        },
      },
    ],
  },
  {
    date: '2026-10-11',
    title: { en: 'Finance analysis', id: 'Analisis keuangan' },
    changes: [
      {
        kind: 'new',
        text: {
          en: 'Book cards show your spending by category as a coloured bar.',
          id: 'Kartu buku menampilkan pengeluaran per kategori sebagai bilah berwarna.',
        },
      },
      {
        kind: 'fixed',
        text: {
          en: 'More natural Indonesian on the home page.',
          id: 'Bahasa Indonesia di halaman utama kini lebih alami.',
        },
      },
      {
        kind: 'improved',
        text: {
          en: 'The home page shows what the app can do now, including the finance analysis, calculations in amounts and checking against your accounts.',
          id: 'Halaman utama kini menampilkan kemampuan terbaru aplikasi, termasuk analisis keuangan, perhitungan di nominal, dan pencocokan dengan rekeningmu.',
        },
      },
      {
        kind: 'fixed',
        text: {
          en: 'Holding a finger on the bottom bar no longer opens the link menu, so sliding to switch pages works.',
          id: 'Menahan jari di bilah bawah tidak lagi membuka menu tautan, jadi geser untuk berpindah halaman berfungsi.',
        },
      },
      {
        kind: 'new',
        text: {
          en: "For an entry in another currency, type the total in the book's currency too: fill in any two of amount, rate and total, and the third is worked out.",
          id: 'Untuk entri dalam mata uang lain, total dalam mata uang buku kini bisa diketik: isi dua dari nominal, kurs, dan total, dan yang ketiga dihitung otomatis.',
        },
      },
      {
        kind: 'new',
        text: {
          en: 'Rearrange the menu and choose the page the app opens on, in Settings. Your choice follows you to other devices.',
          id: 'Atur urutan menu dan pilih halaman yang dibuka saat aplikasi dibuka, di Pengaturan. Pilihanmu ikut ke perangkat lain.',
        },
      },
      {
        kind: 'new',
        text: {
          en: 'On phones, slide your finger across the bottom bar to switch pages.',
          id: 'Di ponsel, geser jarimu di bilah bawah untuk berpindah halaman.',
        },
      },
      {
        kind: 'new',
        text: {
          en: 'Type a calculation such as (24/22)*28500000 in an amount, exchange rate or account balance. The calculator button switches your phone to a keyboard with the symbols.',
          id: 'Ketik perhitungan seperti (24/22)*28500000 di jumlah, kurs, atau saldo akun. Tombol kalkulator mengganti keyboard ponselmu ke keyboard dengan simbolnya.',
        },
      },
      {
        kind: 'fixed',
        text: {
          en: 'Screen readers announce the labels of number fields.',
          id: 'Pembaca layar kini membacakan label kolom angka.',
        },
      },
      {
        kind: 'new',
        text: {
          en: 'Each book has an Analysis view: your savings rate, daily spending and top category, charts of cash flow and balance over time, and where your money went by category. Switch to a table to read every number.',
          id: 'Setiap buku punya tampilan Analisis: tingkat tabungan, pengeluaran harian dan kategori terbesar, grafik arus kas dan saldo dari waktu ke waktu, serta ke mana uangmu pergi per kategori. Ganti ke tabel untuk membaca setiap angka.',
        },
      },
      {
        kind: 'new',
        text: {
          en: 'More income categories: bonus, business, freelance, rental income, investment returns, crypto, exchange rate gain, gifts received, and refunds & cashback.',
          id: 'Kategori pemasukan baru: bonus, usaha, freelance, pendapatan sewa, hasil investasi, kripto, selisih kurs, hadiah diterima, serta refund & cashback.',
        },
      },
      {
        kind: 'improved',
        text: {
          en: 'Categories are colour-coded by group in entries, cards and charts.',
          id: 'Kategori kini diberi warna per kelompok di entri, kartu, dan grafik.',
        },
      },
      {
        kind: 'fixed',
        text: {
          en: 'Negative amounts are easier to read in dark mode.',
          id: 'Jumlah negatif lebih mudah dibaca di mode gelap.',
        },
      },
    ],
  },
  {
    date: '2026-10-10',
    title: { en: 'Finances', id: 'Keuangan' },
    changes: [
      {
        kind: 'fixed',
        text: {
          en: 'The bottom of note cards matches task and book cards, without a dark band behind the buttons.',
          id: 'Bagian bawah kartu catatan kini sama dengan kartu tugas dan buku, tanpa pita gelap di belakang tombol.',
        },
      },
      {
        kind: 'improved',
        text: {
          en: 'On phones, the bottom navigation bar is a slimmer pill that sits lower, and messages appear above it and above the create button instead of covering them.',
          id: 'Di ponsel, bilah navigasi bawah kini berbentuk pil yang lebih ramping dan lebih rendah, dan pesan muncul di atasnya serta di atas tombol buat, tidak lagi menutupinya.',
        },
      },
      {
        kind: 'fixed',
        text: {
          en: 'In the installed app on iPhone, the status bar follows your theme and the bottom navigation bar stays clear of the screen corners.',
          id: 'Di aplikasi yang terpasang di iPhone, bilah status mengikuti temamu dan bilah navigasi bawah tidak lagi terpotong sudut layar.',
        },
      },
      {
        kind: 'fixed',
        text: {
          en: 'Account totals no longer overlap when the text is large.',
          id: 'Total akun tidak lagi bertumpuk saat ukuran teks besar.',
        },
      },
      {
        kind: 'new',
        text: {
          en: 'Duplicate a book with its entries and accounts into a new book of your own, from the book or its card.',
          id: 'Duplikat buku beserta entri dan akunnya menjadi buku baru milikmu sendiri, dari buku atau kartunya.',
        },
      },
      {
        kind: 'improved',
        text: {
          en: 'The tip about a possible unrecorded entry opens from the difference amount.',
          id: 'Tips tentang kemungkinan entri yang belum dicatat kini muncul dari jumlah selisih.',
        },
      },
      {
        kind: 'improved',
        text: {
          en: 'Your accounts line up with their totals and take less space: tips on Add account and on the difference explain them.',
          id: 'Akunmu kini sejajar dengan totalnya dan lebih ringkas: tips di Tambah akun dan di selisih menjelaskannya.',
        },
      },
      {
        kind: 'fixed',
        text: {
          en: 'Typing in your accounts no longer jumps or resets while the book saves, and a balance you leave empty stays empty.',
          id: 'Mengetik di akunmu tidak lagi melompat atau ter-reset saat buku disimpan, dan saldo yang dibiarkan kosong tetap kosong.',
        },
      },
      {
        kind: 'improved',
        text: {
          en: 'Your accounts sit in the summary card, in a more compact layout.',
          id: 'Akunmu kini berada di kartu ringkasan, dengan tampilan yang lebih ringkas.',
        },
      },
      {
        kind: 'fixed',
        text: {
          en: 'Opening Add entry or an existing entry now puts the cursor in the description.',
          id: 'Membuka Tambah entri atau entri yang sudah ada kini langsung menaruh kursor di deskripsi.',
        },
      },
      {
        kind: 'improved',
        text: {
          en: 'The entry form starts at the description, and goes back to it after each entry you add.',
          id: 'Formulir entri dimulai dari deskripsi, dan kembali ke sana setelah setiap entri yang kamu tambahkan.',
        },
      },
      {
        kind: 'new',
        text: {
          en: "Add your wallets and bank accounts to a book with what they hold, and see how that compares with the book's balance.",
          id: 'Tambahkan dompet dan rekening bankmu ke buku beserta isinya, lalu lihat perbandingannya dengan saldo buku.',
        },
      },
      {
        kind: 'improved',
        text: {
          en: "Why a book's currency can't be changed now shows as a tip when you point at or tap it.",
          id: 'Alasan mata uang buku tidak bisa diubah kini muncul sebagai tips saat kamu mengarahkan kursor atau mengetuknya.',
        },
      },
      {
        kind: 'improved',
        text: {
          en: 'Changelog updates from the same day appear together under one date.',
          id: 'Pembaruan catatan perubahan pada hari yang sama ditampilkan bersama di bawah satu tanggal.',
        },
      },
      {
        kind: 'fixed',
        text: {
          en: 'Card groups and section headings stay centered when pinning and unpinning cards.',
          id: 'Kelompok kartu dan judul bagian tetap berada di tengah saat menyematkan dan melepas sematan kartu.',
        },
      },
      {
        kind: 'improved',
        text: {
          en: 'The landing page task preview overlaps the other cards on phones for a more compact layout.',
          id: 'Pratinjau tugas di halaman awal bertumpuk dengan kartu lainnya di ponsel agar lebih ringkas.',
        },
      },
      {
        kind: 'improved',
        text: {
          en: 'Settings navigation stays visible while scrolling on phones too.',
          id: 'Navigasi pengaturan tetap terlihat saat menggulir di ponsel juga.',
        },
      },
      {
        kind: 'improved',
        text: {
          en: 'Forms, new entries and page navigation have subtle transitions. Reduced-motion preferences turn them off.',
          id: 'Formulir, entri baru, dan perpindahan halaman memiliki transisi halus. Transisi dinonaktifkan jika kamu memilih untuk mengurangi gerakan.',
        },
      },
      {
        kind: 'improved',
        text: {
          en: 'Editing an entry opens its form in place, with the Add entry button available above the list.',
          id: 'Saat mengubah entri, formulir terbuka di tempat entri tersebut, dengan tombol Tambah entri tersedia di atas daftar.',
        },
      },
      {
        kind: 'fixed',
        text: {
          en: 'Date and quantity stay aligned when editing the date, and the amount is always ready to type.',
          id: 'Tanggal dan jumlah barang tetap sejajar saat mengubah tanggal, dan nominal selalu siap diisi.',
        },
      },
      {
        kind: 'improved',
        text: {
          en: 'Add and edit finance entries directly on the book page. After adding one, the form stays ready for the next, keeping your date, currency, rate and category. Fields follow date, quantity, description, category and amount. Date, currency and exchange rate appear as small text until clicked, and return to text after adding an entry. Tighter spacing, a toggle with money-out and money-in icons, and @ for quantity keep the form compact on phones.',
          id: 'Tambah dan ubah entri keuangan langsung di halaman buku. Setelah menambah entri, formulir tetap siap untuk berikutnya dengan tanggal, mata uang, kurs, dan kategori yang sama. Kolom berurutan dari tanggal, jumlah barang, keterangan, kategori, lalu nominal. Tanggal, mata uang, dan kurs tampil sebagai teks kecil hingga diklik, lalu kembali menjadi teks setelah entri ditambahkan. Jarak yang lebih rapat, tombol geser dengan ikon uang keluar dan masuk, serta @ untuk jumlah barang membuat formulir ringkas di ponsel.',
        },
      },
      {
        kind: 'improved',
        text: {
          en: 'Currency conversion labels and saved exchange rates use shorter wording.',
          id: 'Label konversi mata uang dan kurs tersimpan memakai kata-kata yang lebih singkat.',
        },
      },
      {
        kind: 'fixed',
        text: {
          en: 'Quantity and date fields stack on narrow screens so the date has room and stays inside its button.',
          id: 'Kolom jumlah barang dan tanggal tersusun ke bawah di layar sempit agar tanggal lebih lega dan tetap di dalam tombolnya.',
        },
      },
      {
        kind: 'fixed',
        text: {
          en: 'Finance entry totals stay aligned to the right on phones too.',
          id: 'Total entri keuangan tetap rata kanan di ponsel juga.',
        },
      },
      {
        kind: 'improved',
        text: {
          en: 'The exchange-rate hint is shorter and easier to scan.',
          id: 'Petunjuk kurs lebih singkat dan mudah dibaca.',
        },
      },
      {
        kind: 'improved',
        text: {
          en: 'Entries in another currency show the exchange rate used, with readable details and totals on phones.',
          id: 'Entri dalam mata uang lain menampilkan kurs yang dipakai, dengan rincian dan total yang mudah dibaca di ponsel.',
        },
      },
      {
        kind: 'new',
        text: {
          en: 'When entering another currency, see its converted total as you type, including quantity and your exchange rate. Your default-currency total also appears when it differs from the book.',
          id: 'Saat mengisi mata uang lain, lihat total konversinya sambil mengetik, termasuk jumlah barang dan kursmu. Total dalam mata uang utamamu juga tampil jika berbeda dari buku.',
        },
      },
      {
        kind: 'fixed',
        text: {
          en: 'About, privacy, terms and changelog pages have even padding inside their cards and a smaller gap before the footer.',
          id: 'Halaman tentang aplikasi, privasi, syarat layanan, dan catatan perubahan memiliki jarak dalam kartu yang merata dan jarak lebih kecil ke bagian bawah.',
        },
      },
      {
        kind: 'fixed',
        text: {
          en: 'Footer links have less space above them, and Catat Saja keeps the same brand color on every page, including the landing page.',
          id: 'Jarak di atas tautan bagian bawah lebih rapat, dan Catat Saja memakai warna merek yang sama di setiap halaman, termasuk halaman depan.',
        },
      },
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
