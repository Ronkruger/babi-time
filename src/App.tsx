import { FormEvent, KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";
import { uploadImageFile } from "./lib/upload";

type PartnerRole = "male" | "female";

type InvitationShare = {
  title: string;
  message: string;
  date: string;
  time: string;
  place: string;
  gif: string;
  sticker: string;
};

type Message = {
  id: string;
  sender: PartnerRole;
  text: string;
  image?: string;
  type?: "text" | "invitation";
  invitation?: InvitationShare;
  createdAt: string;
};

type MoodValue = "in-love" | "happy" | "missing-you" | "stressed" | "sleepy";

type Checkin = {
  mood: MoodValue;
  note: string;
  updatedAt: string;
};

type MemoryItem = {
  id: string;
  text: string;
  date: string;
  author: PartnerRole;
  favorite: boolean;
};

type InvitationTemplate = {
  id: string;
  name: string;
  title: string;
  message: string;
};

type InvitationItem = {
  id: string;
  templateId: string;
  title: string;
  message: string;
  date: string;
  time: string;
  place: string;
  gif: string;
  sticker: string;
  createdBy: PartnerRole;
  createdAt: string;
};

const START_DATE_KEY = "babi_time_start_date";
const MESSAGES_KEY = "babi_time_messages";
const SESSION_ROLE_KEY = "babi_time_role";
const CHECKINS_KEY = "babi_time_checkins";
const MEMORIES_KEY = "babi_time_memories";
const DATE_IDEAS_KEY = "babi_time_date_ideas";
const INVITATIONS_KEY = "babi_time_invitations";
const SEEN_INVITE_MESSAGE_IDS_KEY = "babi_time_seen_invite_message_ids";

const INVITATION_TEMPLATES: InvitationTemplate[] = [
  {
    id: "sunset-romance",
    name: "Sunset Romance",
    title: "Sunset Date for Two",
    message: "Let's watch the sunset and enjoy the evening together.",
  },
  {
    id: "coffee-cute",
    name: "Coffee Cute",
    title: "Coffee + Catch Up",
    message: "I miss you. Let's grab coffee and talk about everything.",
  },
  {
    id: "movie-night",
    name: "Movie Night",
    title: "Cozy Movie Night",
    message: "Blanket, snacks, and us. Pick a movie and cuddle time.",
  },
  {
    id: "dinner-elegant",
    name: "Dinner Elegant",
    title: "Special Dinner Date",
    message: "Dress up with me and let's have a memorable dinner date.",
  },
  {
    id: "adventure-day",
    name: "Adventure Day",
    title: "Adventure Together",
    message: "Let's try something new and make a fresh memory today.",
  },
  {
    id: "picnic-love",
    name: "Picnic Love",
    title: "Picnic Date",
    message: "Let's have a cute picnic and spend slow quality time.",
  },
  {
    id: "game-night",
    name: "Game Night",
    title: "Playful Game Night",
    message: "Bring your best mood and let me win at least once.",
  },
  {
    id: "staycation",
    name: "Staycation",
    title: "Mini Staycation",
    message: "Let's pause the world and enjoy a little escape together.",
  },
  {
    id: "surprise-date",
    name: "Surprise",
    title: "Mystery Date Invitation",
    message: "Don't ask questions, just be ready for a cute surprise.",
  },
  {
    id: "anniv-special",
    name: "Anniv Special",
    title: "Monthsary / Anniversary Celebration",
    message: "Let's celebrate us and make this day extra special.",
  },
];

const GIF_OPTIONS = [
  "https://media.giphy.com/media/l0HlBO7eyXzSZkJri/giphy.gif",
  "https://media.giphy.com/media/3oriO0OEd9QIDdllqo/giphy.gif",
  "https://media.giphy.com/media/MDJ9IbxxvDUQM/giphy.gif",
  "https://media.giphy.com/media/26BRv0ThflsHCqDrG/giphy.gif",
  "https://media.giphy.com/media/5GoVLqeAOo6PK/giphy.gif",
  "https://media.giphy.com/media/3o7TKtnuHOHHUjR38Y/giphy.gif",
  "https://media.giphy.com/media/11sBLVxNs7v6WA/giphy.gif",
  "https://media.giphy.com/media/10UeedrT5MIfPG/giphy.gif",
];

const STICKER_OPTIONS = ["💌", "💖", "🌹", "🐻", "✨", "💍", "🍓", "🎀", "🫶", "🥰", "🎡", "🌙"];
const DECLINE_TEASE_TEXTS = [
  "No 😌",
  "No, no please accept it 🥺",
  "Come on, say yes 💞",
  "Please accept this date 💖",
  "Still no? Try accept 😘",
  "Only accept works 😇",
];

const DEFAULT_DATE_IDEAS = [
  "Sunset walk + street food date",
  "Cook dinner together and rate each dish",
  "Movie night with matching pajamas",
  "No-phone cafe date for 1 hour",
  "Memory lane: revisit your first date spot",
  "At-home spa night with soft music",
  "Mini photoshoot and make a shared album",
];

const MOOD_OPTIONS: { value: MoodValue; label: string; emoji: string }[] = [
  { value: "in-love", label: "In Love", emoji: "😍" },
  { value: "happy", label: "Happy", emoji: "😊" },
  { value: "missing-you", label: "Missing You", emoji: "🥺" },
  { value: "stressed", label: "Stressed", emoji: "😵" },
  { value: "sleepy", label: "Sleepy", emoji: "😴" },
];

const readStartDate = () => localStorage.getItem(START_DATE_KEY) ?? "2025-10-15";

const readMessages = (): Message[] => {
  const raw = localStorage.getItem(MESSAGES_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as Message[];
  } catch {
    return [];
  }
};

const readRole = (): PartnerRole | null => {
  const raw = sessionStorage.getItem(SESSION_ROLE_KEY);
  if (raw === "male" || raw === "female") return raw;
  return null;
};

const defaultCheckins = (): Record<PartnerRole, Checkin> => ({
  male: {
    mood: "in-love",
    note: "",
    updatedAt: "",
  },
  female: {
    mood: "in-love",
    note: "",
    updatedAt: "",
  },
});

const readCheckins = (): Record<PartnerRole, Checkin> => {
  const raw = localStorage.getItem(CHECKINS_KEY);
  if (!raw) return defaultCheckins();
  try {
    const parsed = JSON.parse(raw) as Record<PartnerRole, Checkin>;
    return {
      male: {
        mood: parsed.male?.mood ?? "in-love",
        note: parsed.male?.note ?? "",
        updatedAt: parsed.male?.updatedAt ?? "",
      },
      female: {
        mood: parsed.female?.mood ?? "in-love",
        note: parsed.female?.note ?? "",
        updatedAt: parsed.female?.updatedAt ?? "",
      },
    };
  } catch {
    return defaultCheckins();
  }
};

const readMemories = (): MemoryItem[] => {
  const raw = localStorage.getItem(MEMORIES_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as MemoryItem[];
  } catch {
    return [];
  }
};

const readDateIdeas = (): string[] => {
  const raw = localStorage.getItem(DATE_IDEAS_KEY);
  if (!raw) return DEFAULT_DATE_IDEAS;
  try {
    const parsed = JSON.parse(raw) as string[];
    return parsed.length ? parsed : DEFAULT_DATE_IDEAS;
  } catch {
    return DEFAULT_DATE_IDEAS;
  }
};

const readInvitations = (): InvitationItem[] => {
  const raw = localStorage.getItem(INVITATIONS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as InvitationItem[];
  } catch {
    return [];
  }
};

const readSeenInviteMessageIds = (): Record<PartnerRole, string[]> => {
  const raw = localStorage.getItem(SEEN_INVITE_MESSAGE_IDS_KEY);
  if (!raw) return { male: [], female: [] };
  try {
    const parsed = JSON.parse(raw) as Partial<Record<PartnerRole, string[]>>;
    return {
      male: parsed.male ?? [],
      female: parsed.female ?? [],
    };
  } catch {
    return { male: [], female: [] };
  }
};

const addMonths = (date: Date, months: number): Date => {
  const target = new Date(date);
  const day = target.getDate();
  target.setMonth(target.getMonth() + months);
  if (target.getDate() < day) target.setDate(0);
  return target;
};

const dateLabel = (date: Date) =>
  date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

const getDuration = (fromDate: Date, toDate: Date) => {
  const safeToDate = toDate < fromDate ? fromDate : toDate;
  let years = safeToDate.getFullYear() - fromDate.getFullYear();
  let months = safeToDate.getMonth() - fromDate.getMonth();
  let days = safeToDate.getDate() - fromDate.getDate();

  if (days < 0) {
    const previousMonth = new Date(safeToDate.getFullYear(), safeToDate.getMonth(), 0).getDate();
    days += previousMonth;
    months -= 1;
  }

  if (months < 0) {
    months += 12;
    years -= 1;
  }

  const diffMs = safeToDate.getTime() - fromDate.getTime();
  const totalDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const totalWeeks = Math.floor(totalDays / 7);

  return { years, months, days, totalDays, totalWeeks };
};

const getUpcomingEvents = (startDate: Date, now: Date) => {
  const upcoming: { title: string; date: Date }[] = [];
  for (let i = 1; i <= 24; i += 1) {
    const monthsaryDate = addMonths(startDate, i);
    if (monthsaryDate >= now) {
      upcoming.push({
        title: `${i}${getOrdinalSuffix(i)} monthsary`,
        date: monthsaryDate,
      });
    }
  }

  for (let i = 1; i <= 5; i += 1) {
    const anniversaryDate = addMonths(startDate, i * 12);
    if (anniversaryDate >= now) {
      upcoming.push({
        title: `${i}${getOrdinalSuffix(i)} anniversary`,
        date: anniversaryDate,
      });
    }
  }

  return upcoming
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, 10);
};

const getOrdinalSuffix = (n: number): string => {
  const j = n % 10;
  const k = n % 100;
  if (j === 1 && k !== 11) return "st";
  if (j === 2 && k !== 12) return "nd";
  if (j === 3 && k !== 13) return "rd";
  return "th";
};

const toYmd = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

const App = () => {
  const [role, setRole] = useState<PartnerRole | null>(readRole);
  const [startDate, setStartDate] = useState<string>(readStartDate);
  const [messages, setMessages] = useState<Message[]>(readMessages);
  const [checkins, setCheckins] = useState<Record<PartnerRole, Checkin>>(readCheckins);
  const [memories, setMemories] = useState<MemoryItem[]>(readMemories);
  const [dateIdeas, setDateIdeas] = useState<string[]>(readDateIdeas);
  const [currentIdea, setCurrentIdea] = useState<string>("Tap Pick Idea and plan your next date 💡");
  const [customIdea, setCustomIdea] = useState("");
  const [memoryText, setMemoryText] = useState("");
  const [memoryDate, setMemoryDate] = useState(() => toYmd(new Date()));
  const [invitations, setInvitations] = useState<InvitationItem[]>(readInvitations);
  const [selectedTemplateId, setSelectedTemplateId] = useState(INVITATION_TEMPLATES[0].id);
  const [invitationTitle, setInvitationTitle] = useState(INVITATION_TEMPLATES[0].title);
  const [invitationMessage, setInvitationMessage] = useState(INVITATION_TEMPLATES[0].message);
  const [invitationDate, setInvitationDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return toYmd(tomorrow);
  });
  const [invitationTime, setInvitationTime] = useState("19:00");
  const [invitationPlace, setInvitationPlace] = useState("");
  const [selectedGif, setSelectedGif] = useState(GIF_OPTIONS[0]);
  const [selectedSticker, setSelectedSticker] = useState(STICKER_OPTIONS[0]);
  const [customInvitationGif, setCustomInvitationGif] = useState<string | undefined>();
  const [isInvitationBuilderOpen, setInvitationBuilderOpen] = useState(false);
  const [seenInviteMessageIds, setSeenInviteMessageIds] = useState<Record<PartnerRole, string[]>>(readSeenInviteMessageIds);
  const [incomingInvitationMessage, setIncomingInvitationMessage] = useState<Message | null>(null);
  const [incomingCardOpened, setIncomingCardOpened] = useState(false);
  const [declineAttempts, setDeclineAttempts] = useState(0);
  const [declineOffset, setDeclineOffset] = useState({ x: 0, y: 0 });
  const [draftText, setDraftText] = useState("");
  const [draftImage, setDraftImage] = useState<string | undefined>();
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const [viewDate, setViewDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const now = new Date();
  const coupleStart = useMemo(() => new Date(startDate), [startDate]);
  const stats = useMemo(() => getDuration(coupleStart, now), [coupleStart, now]);
  const events = useMemo(() => getUpcomingEvents(coupleStart, now), [coupleStart, now]);

  const importantDates = useMemo(() => {
    const map = new Map<string, string>();
    map.set(toYmd(coupleStart), "Started together 💖");
    events.forEach((event) => {
      map.set(toYmd(event.date), event.title);
    });
    return map;
  }, [coupleStart, events]);

  const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
  const firstWeekday = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay();
  const gridCells = Array.from({ length: 42 }, (_, index) => {
    const dayNumber = index - firstWeekday + 1;
    if (dayNumber < 1 || dayNumber > daysInMonth) return null;
    return new Date(viewDate.getFullYear(), viewDate.getMonth(), dayNumber);
  });

  const saveStartDate = (value: string) => {
    setStartDate(value);
    localStorage.setItem(START_DATE_KEY, value);
  };

  const loginAs = (selectedRole: PartnerRole) => {
    setRole(selectedRole);
    sessionStorage.setItem(SESSION_ROLE_KEY, selectedRole);
  };

  const logout = () => {
    setRole(null);
    sessionStorage.removeItem(SESSION_ROLE_KEY);
  };

  const onImageSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      setDraftImage(undefined);
      return;
    }
    try {
      const uploadedUrl = await uploadImageFile(file);
      setDraftImage(uploadedUrl);
    } catch (error) {
      console.error(error);
      alert("Image upload failed. Please try again.");
      setDraftImage(undefined);
    }
  };

  const sendMessage = (event: FormEvent) => {
    event.preventDefault();
    if (!role) return;
    const cleanText = draftText.trim();
    if (!cleanText && !draftImage) return;
    const nextMessage: Message = {
      id: crypto.randomUUID(),
      sender: role,
      text: cleanText,
      image: draftImage,
      createdAt: new Date().toISOString(),
    };
    const nextMessages = [...messages, nextMessage];
    setMessages(nextMessages);
    localStorage.setItem(MESSAGES_KEY, JSON.stringify(nextMessages));
    setDraftText("");
    setDraftImage(undefined);
  };

  const updateMyCheckin = (patch: Partial<Checkin>) => {
    if (!role) return;
    setCheckins((previous) => ({
      ...previous,
      [role]: {
        ...previous[role],
        ...patch,
      },
    }));
  };

  const saveMyCheckin = () => {
    if (!role) return;
    const next = {
      ...checkins,
      [role]: {
        ...checkins[role],
        updatedAt: new Date().toISOString(),
      },
    };
    setCheckins(next);
    localStorage.setItem(CHECKINS_KEY, JSON.stringify(next));
  };

  const pickDateIdea = () => {
    if (!dateIdeas.length) return;
    const index = Math.floor(Math.random() * dateIdeas.length);
    setCurrentIdea(dateIdeas[index]);
  };

  const addCustomIdea = (event: FormEvent) => {
    event.preventDefault();
    const trimmed = customIdea.trim();
    if (!trimmed) return;
    if (dateIdeas.some((idea) => idea.toLowerCase() === trimmed.toLowerCase())) {
      setCustomIdea("");
      return;
    }
    const nextIdeas = [trimmed, ...dateIdeas];
    setDateIdeas(nextIdeas);
    localStorage.setItem(DATE_IDEAS_KEY, JSON.stringify(nextIdeas));
    setCurrentIdea(trimmed);
    setCustomIdea("");
  };

  const addMemory = (event: FormEvent) => {
    event.preventDefault();
    if (!role) return;
    const text = memoryText.trim();
    if (!text) return;
    const nextItem: MemoryItem = {
      id: crypto.randomUUID(),
      text,
      date: memoryDate,
      author: role,
      favorite: false,
    };
    const nextMemories = [nextItem, ...memories];
    setMemories(nextMemories);
    localStorage.setItem(MEMORIES_KEY, JSON.stringify(nextMemories));
    setMemoryText("");
  };

  const toggleFavoriteMemory = (id: string) => {
    const nextMemories = memories.map((item) =>
      item.id === id
        ? {
            ...item,
            favorite: !item.favorite,
          }
        : item
    );
    setMemories(nextMemories);
    localStorage.setItem(MEMORIES_KEY, JSON.stringify(nextMemories));
  };

  const onTemplateSelect = (templateId: string) => {
    const template = INVITATION_TEMPLATES.find((entry) => entry.id === templateId);
    if (!template) return;
    setSelectedTemplateId(template.id);
    setInvitationTitle(template.title);
    setInvitationMessage(template.message);
  };

  const onInvitationGifSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const uploadedUrl = await uploadImageFile(file);
      setCustomInvitationGif(uploadedUrl);
    } catch (error) {
      console.error(error);
      alert("GIF upload failed. Please try again.");
    }
  };

  const saveInvitation = (event: FormEvent) => {
    event.preventDefault();
    if (!role) return;
    const title = invitationTitle.trim();
    const message = invitationMessage.trim();
    if (!title || !message || !invitationDate || !invitationTime || !invitationPlace.trim()) return;

    const nextInvitation: InvitationItem = {
      id: crypto.randomUUID(),
      templateId: selectedTemplateId,
      title,
      message,
      date: invitationDate,
      time: invitationTime,
      place: invitationPlace.trim(),
      gif: customInvitationGif || selectedGif,
      sticker: selectedSticker,
      createdBy: role,
      createdAt: new Date().toISOString(),
    };

    const nextInvitations = [nextInvitation, ...invitations];
    setInvitations(nextInvitations);
    localStorage.setItem(INVITATIONS_KEY, JSON.stringify(nextInvitations));
    setInvitationBuilderOpen(false);
  };

  const sendInvitationToChat = (invitation: InvitationShare) => {
    if (!role) return;
    const invitationText = [
      `${invitation.sticker} ${invitation.title}`,
      invitation.message,
      `📅 ${new Date(invitation.date).toLocaleDateString()} · ${invitation.time}`,
      `📍 ${invitation.place}`,
    ].join("\n");

    const nextMessage: Message = {
      id: crypto.randomUUID(),
      sender: role,
      text: invitationText,
      image: invitation.gif,
      type: "invitation",
      invitation,
      createdAt: new Date().toISOString(),
    };
    const nextMessages = [...messages, nextMessage];
    setMessages(nextMessages);
    localStorage.setItem(MESSAGES_KEY, JSON.stringify(nextMessages));
  };

  const markIncomingInvitationAsSeen = () => {
    if (!role || !incomingInvitationMessage) return;
    const nextSeen = {
      ...seenInviteMessageIds,
      [role]: [...seenInviteMessageIds[role], incomingInvitationMessage.id],
    };
    setSeenInviteMessageIds(nextSeen);
    localStorage.setItem(SEEN_INVITE_MESSAGE_IDS_KEY, JSON.stringify(nextSeen));
    setIncomingInvitationMessage(null);
    setIncomingCardOpened(false);
    setDeclineAttempts(0);
    setDeclineOffset({ x: 0, y: 0 });
  };

  const acceptIncomingInvitation = () => {
    if (!role || !incomingInvitationMessage?.invitation) {
      markIncomingInvitationAsSeen();
      return;
    }

    const nextMessage: Message = {
      id: crypto.randomUUID(),
      sender: role,
      type: "text",
      text: `💖 I accept your invitation: ${incomingInvitationMessage.invitation.title}`,
      createdAt: new Date().toISOString(),
    };
    const nextMessages = [...messages, nextMessage];
    setMessages(nextMessages);
    localStorage.setItem(MESSAGES_KEY, JSON.stringify(nextMessages));
    markIncomingInvitationAsSeen();
  };

  const teaseDecline = () => {
    setDeclineAttempts((previous) => previous + 1);
    const randomX = Math.round((Math.random() - 0.5) * 140);
    const randomY = Math.round((Math.random() - 0.5) * 60);
    setDeclineOffset({ x: randomX, y: randomY });
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!role) return;
    const unseenIncoming = [...messages]
      .reverse()
      .find(
        (message) =>
          message.type === "invitation" &&
          message.sender !== role &&
          !seenInviteMessageIds[role].includes(message.id)
      );
    if (unseenIncoming) {
      setIncomingInvitationMessage(unseenIncoming);
      setIncomingCardOpened(false);
      setDeclineAttempts(0);
      setDeclineOffset({ x: 0, y: 0 });
    }
  }, [messages, role, seenInviteMessageIds]);

  const onComposerKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage(event as unknown as FormEvent);
    }
  };

  const myName = role === "male" ? "Ronron" : "Bribri";
  const partnerName = role === "male" ? "Bribri" : "Ronron";
  const myCheckin = role ? checkins[role] : defaultCheckins().male;
  const activeInvitationGif = customInvitationGif || selectedGif;
  const lastMessage = messages[messages.length - 1];
  const lastMessagePreview = lastMessage
    ? lastMessage.type === "invitation"
      ? "💌 Date invitation"
      : lastMessage.text || (lastMessage.image ? "📷 Sent an image" : "New message")
    : "Start your first sweet message 💌";

  if (!role) {
    return (
      <div className="app-shell login-bg">
        <div className="login-card">
          <h1>Babi Time</h1>
          <p>Choose your side to enter your shared love space.</p>
          <div className="login-actions">
            <button type="button" className="ronron-btn" onClick={() => loginAs("male")}>Login as Ronron</button>
            <button type="button" className="bribri-btn" onClick={() => loginAs("female")}>Login as Bribri</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`app-shell ${role === "male" ? "theme-ronron" : "theme-bribri"}`}>
      <header className="top-bar">
        <div>
          <h1>Babi Time Dashboard</h1>
          <p>Logged in as {role === "male" ? "Ronron" : "Bribri"}</p>
        </div>
        <button type="button" className="ghost-btn" onClick={logout}>
          Logout
        </button>
      </header>

      <section className="panel">
        <h2>Relationship Start Date</h2>
        <input type="date" value={startDate} onChange={(e) => saveStartDate(e.target.value)} />
      </section>

      <section className="grid-two">
        <article className="panel">
          <h2>Together For</h2>
          <div className="stats-grid">
            <div><strong>{stats.years}</strong><span>Years</span></div>
            <div><strong>{stats.months}</strong><span>Months</span></div>
            <div><strong>{stats.days}</strong><span>Days</span></div>
            <div><strong>{stats.totalWeeks}</strong><span>Weeks (total)</span></div>
            <div><strong>{stats.totalDays}</strong><span>Days (total)</span></div>
          </div>
        </article>

        <article className="panel">
          <h2>Upcoming Love Dates</h2>
          <ul className="events-list">
            {events.map((event) => (
              <li key={`${event.title}-${event.date.toISOString()}`}>
                <span>{event.title}</span>
                <strong>{dateLabel(event.date)}</strong>
              </li>
            ))}
          </ul>
        </article>
      </section>

      <section className="grid-two couples-extras">
        <article className="panel">
          <div className="section-head">
            <h2>Love Check-In</h2>
            <span className="pill">Daily</span>
          </div>
          <div className="checkin-grid">
            {(["male", "female"] as PartnerRole[]).map((entryRole) => {
              const person = entryRole === "male" ? "Ronron" : "Bribri";
              const checkin = checkins[entryRole];
              const mood = MOOD_OPTIONS.find((item) => item.value === checkin.mood) ?? MOOD_OPTIONS[0];
              return (
                <div key={entryRole} className="checkin-card">
                  <strong>{person}</strong>
                  <p>{mood.emoji} {mood.label}</p>
                  <small>{checkin.note || "No note yet"}</small>
                  {checkin.updatedAt && <span>{new Date(checkin.updatedAt).toLocaleString()}</span>}
                </div>
              );
            })}
          </div>

          <div className="checkin-editor">
            <label>
              Your mood
              <select
                value={myCheckin.mood}
                onChange={(event) => updateMyCheckin({ mood: event.target.value as MoodValue })}
              >
                {MOOD_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.emoji} {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Sweet note
              <textarea
                value={myCheckin.note}
                onChange={(event) => updateMyCheckin({ note: event.target.value })}
                rows={2}
                placeholder="Tell your partner how you feel today..."
              />
            </label>
            <button type="button" onClick={saveMyCheckin}>Save Check-In</button>
          </div>
        </article>

        <article className="panel">
          <div className="section-head">
            <h2>Date Idea Picker</h2>
            <span className="pill">Fun</span>
          </div>
          <p className="idea-card">{currentIdea}</p>
          <div className="idea-actions">
            <button type="button" onClick={pickDateIdea}>Pick Idea</button>
          </div>
          <form className="idea-form" onSubmit={addCustomIdea}>
            <input
              type="text"
              value={customIdea}
              onChange={(event) => setCustomIdea(event.target.value)}
              placeholder="Add your own date idea"
            />
            <button type="submit" className="ghost-btn">Add</button>
          </form>
        </article>
      </section>

      <section className="panel memories-panel">
        <div className="section-head">
          <h2>Memory Jar</h2>
          <span className="pill">Shared</span>
        </div>
        <form className="memory-form" onSubmit={addMemory}>
          <input type="date" value={memoryDate} onChange={(event) => setMemoryDate(event.target.value)} />
          <input
            type="text"
            value={memoryText}
            onChange={(event) => setMemoryText(event.target.value)}
            placeholder="Write a moment you want to keep forever"
          />
          <button type="submit">Add Memory</button>
        </form>
        <div className="memories-list">
          {memories.length === 0 && <p className="muted-copy">No memories yet. Add your first one 💞</p>}
          {memories.map((item) => (
            <article key={item.id} className="memory-item">
              <div>
                <strong>{item.author === "male" ? "Ronron" : "Bribri"}</strong>
                <p>{item.text}</p>
                <small>{new Date(item.date).toLocaleDateString()}</small>
              </div>
              <button
                type="button"
                className={`favorite-btn ${item.favorite ? "active" : ""}`}
                onClick={() => toggleFavoriteMemory(item.id)}
              >
                {item.favorite ? "♥" : "♡"}
              </button>
            </article>
          ))}
        </div>
      </section>

      <section className="panel invitation-panel">
        <div className="section-head">
          <h2>Date Invitation Builder</h2>
          <span className="pill">Templates + GIF + Stickers</span>
        </div>
        <p>Create a romantic invite and send it directly to your chat.</p>
        <button type="button" onClick={() => setInvitationBuilderOpen(true)}>Open Invitation Builder</button>
      </section>

      {isInvitationBuilderOpen && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal-card invitation-modal">
            <div className="modal-head">
              <h3>Date Invitation Builder</h3>
              <button type="button" className="ghost-btn" onClick={() => setInvitationBuilderOpen(false)}>Close</button>
            </div>

            <div className="template-grid">
          {INVITATION_TEMPLATES.map((template) => (
            <button
              key={template.id}
              type="button"
              className={`template-chip ${selectedTemplateId === template.id ? "active" : ""}`}
              onClick={() => onTemplateSelect(template.id)}
            >
              {template.name}
            </button>
          ))}
            </div>

            <div className="invitation-grid">
              <form className="invitation-form" onSubmit={saveInvitation}>
            <div className="invitation-form-grid">
              <label>
                Invitation title
                <input
                  type="text"
                  value={invitationTitle}
                  onChange={(event) => setInvitationTitle(event.target.value)}
                  placeholder="Romantic dinner invitation"
                />
              </label>
              <label>
                Place
                <input
                  type="text"
                  value={invitationPlace}
                  onChange={(event) => setInvitationPlace(event.target.value)}
                  placeholder="Cafe name / place"
                />
              </label>
              <label>
                Date
                <input type="date" value={invitationDate} onChange={(event) => setInvitationDate(event.target.value)} />
              </label>
              <label>
                Time
                <input type="time" value={invitationTime} onChange={(event) => setInvitationTime(event.target.value)} />
              </label>
            </div>

            <label>
              Message
              <textarea
                value={invitationMessage}
                onChange={(event) => setInvitationMessage(event.target.value)}
                rows={3}
                placeholder="Write your date invite message"
              />
            </label>

            <div className="gif-selector">
              <strong>Pick a GIF</strong>
              <div className="gif-grid">
                {GIF_OPTIONS.map((gifUrl) => (
                  <button
                    key={gifUrl}
                    type="button"
                    className={`gif-option ${selectedGif === gifUrl && !customInvitationGif ? "active" : ""}`}
                    onClick={() => {
                      setSelectedGif(gifUrl);
                      setCustomInvitationGif(undefined);
                    }}
                  >
                    <img src={gifUrl} alt="Invitation gif" loading="lazy" />
                  </button>
                ))}
              </div>
              <label className="file-label custom-gif-btn">
                Upload custom GIF
                <input type="file" accept="image/gif,image/*" onChange={onInvitationGifSelect} />
              </label>
            </div>

            <div className="sticker-selector">
              <strong>Stickers</strong>
              <div className="sticker-grid">
                {STICKER_OPTIONS.map((sticker) => (
                  <button
                    key={sticker}
                    type="button"
                    className={`sticker-chip ${selectedSticker === sticker ? "active" : ""}`}
                    onClick={() => setSelectedSticker(sticker)}
                  >
                    {sticker}
                  </button>
                ))}
              </div>
            </div>

                <button type="submit">Save Invitation</button>
              </form>

              <aside className="invitation-preview-card">
            <h3>Live Preview</h3>
            <div className="invitation-preview">
              <span className="preview-sticker">{selectedSticker}</span>
              <h4>{invitationTitle || "Date Invitation"}</h4>
              <p>
                {invitationDate ? new Date(invitationDate).toLocaleDateString() : "Pick date"}
                {" · "}
                {invitationTime || "Pick time"}
              </p>
              <p>{invitationPlace || "Choose a place"}</p>
              <small>{invitationMessage || "Write your message"}</small>
              {activeInvitationGif && <img src={activeInvitationGif} alt="Selected invitation gif" />}
            </div>
            <button
              type="button"
              className="send-chat-btn"
              onClick={() =>
                sendInvitationToChat({
                  title: invitationTitle || "Date Invitation",
                  message: invitationMessage || "Let's go on a date together!",
                  date: invitationDate || toYmd(new Date()),
                  time: invitationTime || "19:00",
                  place: invitationPlace || "TBD",
                  gif: activeInvitationGif,
                  sticker: selectedSticker,
                })
              }
            >
              Send Preview to Chat
            </button>

                <div className="saved-invitations">
              <h4>Saved Invitations</h4>
              {invitations.length === 0 && <p className="muted-copy">No invitations yet.</p>}
              {invitations.slice(0, 5).map((invite) => (
                <article key={invite.id} className="saved-invite-item">
                  <div>
                    <strong>{invite.sticker} {invite.title}</strong>
                    <p>{invite.place}</p>
                    <small>
                      {new Date(invite.date).toLocaleDateString()} · {invite.time} · by {invite.createdBy === "male" ? "Ronron" : "Bribri"}
                    </small>
                  </div>
                  <button
                    type="button"
                    className="ghost-btn send-saved-btn"
                    onClick={() =>
                      sendInvitationToChat({
                        title: invite.title,
                        message: invite.message,
                        date: invite.date,
                        time: invite.time,
                        place: invite.place,
                        gif: invite.gif,
                        sticker: invite.sticker,
                      })
                    }
                  >
                    Send to Chat
                  </button>
                </article>
              ))}
                </div>
              </aside>
            </div>
          </div>
        </div>
      )}

      <section className="grid-two">
        <article className="panel">
          <div className="calendar-head">
            <h2>Custom Calendar</h2>
            <div>
              <button
                type="button"
                className="ghost-btn"
                onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))}
              >
                ←
              </button>
              <button
                type="button"
                className="ghost-btn"
                onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))}
              >
                →
              </button>
            </div>
          </div>
          <p className="calendar-title">
            {viewDate.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
          </p>
          <div className="calendar-grid weekdays">
            {"Sun Mon Tue Wed Thu Fri Sat".split(" ").map((day) => (
              <span key={day}>{day}</span>
            ))}
          </div>
          <div className="calendar-grid">
            {gridCells.map((date, idx) => {
              if (!date) return <div key={`empty-${idx}`} className="day-cell muted" />;
              const key = toYmd(date);
              const eventTitle = importantDates.get(key);
              const isToday = key === toYmd(now);
              return (
                <div key={key} className={`day-cell ${eventTitle ? "event-day" : ""} ${isToday ? "today" : ""}`}>
                  <span>{date.getDate()}</span>
                  {eventTitle && <small>{eventTitle}</small>}
                </div>
              );
            })}
          </div>
        </article>

      </section>

      <section className="panel chat-panel messenger-layout chat-section">
          <aside className="conversation-list">
            <h2>Chats</h2>
            <button type="button" className="conversation-item active">
              <span className="avatar">❤</span>
              <span>
                <strong>Ronron & Bribri</strong>
                <small>{lastMessagePreview}</small>
              </span>
            </button>
          </aside>

          <div className="thread-area">
            <div className="thread-header">
              <span className="avatar large">❤</span>
              <div>
                <strong>Ronron & Bribri</strong>
                <small>{partnerName} is in your private chat</small>
              </div>
            </div>

            <div className="chat-box">
              {messages.length === 0 && <p className="muted-copy">Start your first sweet message 💌</p>}
              {messages.map((message) => (
                <div key={message.id} className={`chat-row ${message.sender === role ? "mine" : "theirs"}`}>
                  <div className="chat-bubble">
                    {message.type === "invitation" && <span className="invite-badge">Date Invite</span>}
                    {message.text && <p>{message.text}</p>}
                    {message.image && <img src={message.image} alt="Sent" />}
                    <small>
                      {message.sender === role ? myName : partnerName} · {new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </small>
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            <form className="chat-form" onSubmit={sendMessage}>
              {draftImage && <img src={draftImage} alt="Preview" className="preview-image" />}
              <div className="composer-row">
                <label className="file-label composer-icon" title="Attach image">
                  +
                  <input type="file" accept="image/*" onChange={onImageSelect} />
                </label>
                <textarea
                  value={draftText}
                  onChange={(e) => setDraftText(e.target.value)}
                  onKeyDown={onComposerKeyDown}
                  placeholder="Aa"
                  rows={1}
                />
                <button type="submit" className="send-btn">Send</button>
              </div>
            </form>
          </div>
      </section>

      {incomingInvitationMessage?.invitation && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal-card incoming-invite-modal">
            {!incomingCardOpened ? (
              <div className="incoming-envelope bounce-in">
                <div className="pulse-heart">💌</div>
                <h3>New Date Invitation from {partnerName}!</h3>
                <p>Your love message has arrived.</p>
                <button type="button" onClick={() => setIncomingCardOpened(true)}>Open Message Card</button>
              </div>
            ) : (
              <div className="incoming-card pop-in">
                <span className="preview-sticker">{incomingInvitationMessage.invitation.sticker}</span>
                <h3>{incomingInvitationMessage.invitation.title}</h3>
                <p>
                  {new Date(incomingInvitationMessage.invitation.date).toLocaleDateString()} · {incomingInvitationMessage.invitation.time}
                </p>
                <p>{incomingInvitationMessage.invitation.place}</p>
                <small>{incomingInvitationMessage.invitation.message}</small>
                <img src={incomingInvitationMessage.invitation.gif} alt="Invitation" />
                <div className="invite-actions">
                  <button type="button" className="accept-btn" onClick={acceptIncomingInvitation}>Accept 💖</button>
                  <button
                    type="button"
                    className="decline-btn"
                    onMouseEnter={teaseDecline}
                    onClick={teaseDecline}
                    style={{ transform: `translate(${declineOffset.x}px, ${declineOffset.y}px)` }}
                  >
                    {DECLINE_TEASE_TEXTS[Math.min(declineAttempts, DECLINE_TEASE_TEXTS.length - 1)]}
                  </button>
                </div>
                {declineAttempts > 0 && (
                  <p className="decline-hint">No escape button detected. Accept it already 💘</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
