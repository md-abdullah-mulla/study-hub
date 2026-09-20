import { bootstrapDatabase } from './migrate.js';
import { subjectRepo } from '../repositories/subjectRepo.js';
import { chapterRepo } from '../repositories/chapterRepo.js';
import { topicRepo } from '../repositories/topicRepo.js';
import { activityRepo } from '../repositories/activityRepo.js';
import { config } from '../config.js';

/**
 * SEMESTER 6 STARTER DATA
 * Only the structure is inserted — every topic starts as "not_started",
 * because progress must never be faked (spec §28).
 * Chapters marked `starterTopics` are textbook-obvious placeholders:
 * edit / add / delete them freely from the Chapters page.
 */
const SEMESTER_6 = [
  {
    name: 'Computer Network',
    nameBn: 'কম্পিউটার নেটওয়ার্ক',
    color: '#2563eb',
    chapters: [
      {
        number: 1,
        name: 'Introduction to Computer Network',
        topics: [
          'Network definition',
          'Basic concepts',
          'Network components',
          'Advantages',
          'Applications',
          'Client/Server',
          'Peer-to-Peer',
        ],
      },
    ],
  },
  {
    name: 'IoT & IoT Architecture',
    nameBn: 'ইন্টারনেট অব থিংস',
    color: '#0891b2',
    chapters: [
      {
        number: 1,
        name: 'Introduction to IoT & Architecture',
        topics: [
          'IoT definition',
          'Uses of IoT',
          'IoT Architecture',
          'Architecture layers',
          'Sensors',
          'IoT components',
          'IoT technologies',
          'Edge Computing',
          'Cloud Computing',
          'Communication protocols',
          'MQTT',
          'CoAP',
        ],
      },
    ],
  },
  {
    name: 'DBMS',
    nameBn: 'ডেটাবেজ ম্যানেজমেন্ট সিস্টেম',
    color: '#7c3aed',
    chapters: [
      {
        number: 1,
        name: 'Introduction to Database & DBMS',
        topics: [
          'Database',
          'DBMS',
          'Objectives of DBMS',
          'File System',
          'File System vs DBMS',
          'Advantages of DBMS',
          'Disadvantages of DBMS',
          'Relational Database Management System (RDBMS)',
          'Database Administrator (DBA)',
          'Data Independence',
          'Keys in Database',
        ],
      },
    ],
  },
  {
    name: 'Microcontroller',
    nameBn: 'মাইক্রোকন্ট্রোলার',
    color: '#ea580c',
    chapters: [
      {
        number: 1,
        name: 'Introduction',
        starterTopics: ['Microcontroller definition', 'Microprocessor vs Microcontroller', 'Applications of Microcontroller'],
      },
      {
        number: 2,
        name: 'Embedded Systems Introduction/Core',
        starterTopics: ['Embedded system definition', 'Components of embedded system', 'Embedded system characteristics', 'Real-time systems'],
      },
      {
        number: 3,
        name: 'Architecture',
        topics: ['AVR', 'PIC', '8051', 'Architecture concepts'],
        starterTopics: ['Harvard vs Von Neumann architecture', 'RISC vs CISC'],
      },
      {
        number: 4,
        name: 'Memory Organization & Interfacing',
        starterTopics: ['Memory types (ROM/RAM)', 'Program memory vs Data memory', 'Address decoding', 'Memory interfacing'],
      },
      {
        number: 5,
        name: 'I/O Port Programming',
        starterTopics: ['I/O ports structure', 'Input port programming', 'Output port programming', 'Port pin configuration'],
      },
      {
        number: 6,
        name: 'Timers/Counters',
        starterTopics: ['Timer basics', 'Timer registers', 'Counter mode', 'Delay generation with timer'],
      },
      {
        number: 7,
        name: 'Interrupts',
        starterTopics: ['Interrupt concept', 'Interrupt types', 'Interrupt vector table', 'Interrupt programming'],
      },
      {
        number: 8,
        name: 'ADC & PWM',
        starterTopics: ['ADC basics', 'ADC resolution & registers', 'PWM basics', 'PWM applications'],
      },
      {
        number: 9,
        name: 'Serial & Parallel Communication',
        starterTopics: ['Serial communication basics', 'UART/USART', 'Parallel communication', 'Serial vs Parallel'],
      },
    ],
  },
  {
    name: 'Security-Based Surveillance System',
    nameBn: 'নিরাপত্তাভিত্তিক নজরদারি সিস্টেম',
    color: '#059669',
    chapters: [
      {
        number: 1,
        name: 'নিরাপত্তাভিত্তিক নজরদারি প্রক্রিয়া',
        topics: [
          'Remote Surveillance',
          'Security concepts',
          'Security system advantages',
          'Security system disadvantages',
          'Video Surveillance',
          'Video surveillance advantages',
          'Access Control Surveillance',
          'CCTV System',
          'Motion Detection',
          'IP Camera vs Analog Camera',
        ],
      },
    ],
  },
];

export function seed({ silent = false } = {}) {
  bootstrapDatabase();
  const userId = config.defaultUser.id;
  let created = { subjects: 0, chapters: 0, topics: 0 };

  for (const subjectSeed of SEMESTER_6) {
    let subject = subjectRepo.findByName(userId, subjectSeed.name);
    if (!subject) {
      subject = subjectRepo.create({ userId, name: subjectSeed.name, nameBn: subjectSeed.nameBn, color: subjectSeed.color });
      created.subjects += 1;
    }

    for (const chapterSeed of subjectSeed.chapters) {
      let chapter = chapterRepo.findByName(subject.id, chapterSeed.name);
      if (!chapter) {
        chapter = chapterRepo.create({ subjectId: subject.id, number: chapterSeed.number, name: chapterSeed.name });
        created.chapters += 1;
      }

      const names = [...(chapterSeed.topics ?? []), ...(chapterSeed.starterTopics ?? [])];
      const existing = new Set(topicRepo.listByChapter(chapter.id).map((t) => t.name.toLowerCase()));
      for (const name of names) {
        if (existing.has(name.toLowerCase())) continue;
        topicRepo.create({ chapterId: chapter.id, name });
        created.topics += 1;
      }
    }
  }

  if (created.subjects || created.chapters || created.topics) {
    activityRepo.record({
      userId,
      type: 'seed',
      message: `Semester 6 structure তৈরি হয়েছে — ${created.subjects} subject, ${created.chapters} chapter, ${created.topics} topic`,
    });
  }

  if (!silent) {
    console.log('[seed] done:', created);
  }
  return created;
}

// allow `npm run seed`
if (import.meta.url === `file://${process.argv[1]}`) {
  seed();
}
