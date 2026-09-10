export type Dictionary = {
  meta: {
    description: string;
  };
  home: {
    eyebrow: string;
    lede: string;
    loginCta: string;
    boardsCta: string;
  };
  loginPage: {
    eyebrow: string;
    title: string;
    lede: string;
    loginLabel: string;
    passwordLabel: string;
    submit: string;
    submitting: string;
  };
  boardsPage: {
    eyebrow: string;
    title: string;
    lede: string;
    empty: string;
    openBoard: string;
    copyLink: string;
    createdAt: string;
    logout: string;
    logoutConfirm: string;
  };
  boardForm: {
    title: string;
    titlePlaceholder: string;
    titleDefault: string;
    creating: string;
    create: string;
    createdEyebrow: string;
    createdTitle: string;
    createdLede: string;
    linkLabel: string;
    copyLink: string;
  };
  board: {
    youAre: string;
    invite: string;
    inviting: string;
    inviteHint: string;
    copied: string;
    replies: string;
    stagesNav: string;
    logout: string;
    logoutConfirm: string;
    participantsAria: string;
    participantsTitle: string;
    participantsEmpty: string;
    joinedAt: string;
    closeParticipants: string;
  };
  columns: {
    new: string;
    in_progress: string;
    answered: string;
    done: string;
  };
  quickAdd: {
    trigger: string;
    title: string;
    titlePlaceholder: string;
    urgent: string;
    saving: string;
    save: string;
    cancel: string;
  };
  invitePage: {
    eyebrow: string;
    usedTitle: string;
    usedBody: string;
    joinLede: string;
    nameLabel: string;
    namePlaceholder: string;
    joining: string;
    join: string;
  };
  joinPage: {
    eyebrow: string;
    joinLede: string;
    nameLabel: string;
    namePlaceholder: string;
    joining: string;
    join: string;
  };
  cardPage: {
    back: string;
    close: string;
    stage: string;
    priority: string;
    markUrgent: string;
    clearUrgent: string;
    urgentBadge: string;
    discussion: string;
    emptyThread: string;
    editTitle: string;
    attachments: string;
    attachmentsHint: string;
    attachmentsEmpty: string;
    attachmentsAdd: string;
    attachmentsUploading: string;
    attachmentOpen: string;
    attachmentRemove: string;
    attachmentsUnavailable: string;
    attachmentsLocalCard: string;
    attachmentClosePreview: string;
  };
  comment: {
    placeholder: string;
    sending: string;
    send: string;
    attach: string;
    attachAria: string;
  };
  notFound: {
    title: string;
    body: string;
    home: string;
  };
  common: {
    stageAria: string;
  };
  errors: {
    validation: string;
    createOrganizer: string;
    createBoard: string;
    invalidBoard: string;
    unauthorized: string;
    createInvite: string;
    boardFull: string;
    inviteNotFound: string;
    inviteUsed: string;
    createCard: string;
    cardNotFound: string;
    moveCard: string;
    updateCard: string;
    addComment: string;
    joinFailed: string;
    invalidCredentials: string;
    titleShort: string;
    titleLong: string;
    nameRequired: string;
    nameLong: string;
    cardTitleShort: string;
    commentEmpty: string;
    storageNotConfigured: string;
    fileTooLarge: string;
    fileTypeUnsupported: string;
    uploadFailed: string;
    attachmentLimit: string;
    attachmentNotFound: string;
    deleteAttachment: string;
  };
};

export const en: Dictionary = {
  meta: {
    description: "Public Kanban board via a reusable join link — no registration",
  },
  home: {
    eyebrow: "Shared boards",
    lede: "Open a board link and enter your name — same name rejoins. Owners sign in to create boards and see all of them.",
    loginCta: "Owner sign in",
    boardsCta: "My boards",
  },
  loginPage: {
    eyebrow: "Owner",
    title: "Sign in",
    lede: "Use the owner login from your environment to manage all boards.",
    loginLabel: "Login",
    passwordLabel: "Password",
    submit: "Sign in",
    submitting: "Signing in…",
  },
  boardsPage: {
    eyebrow: "Owner",
    title: "All boards",
    lede: "Create boards and open any of them without joining by name.",
    empty: "No boards yet. Create the first one below.",
    openBoard: "Open",
    copyLink: "Copy link",
    createdAt: "Created",
    logout: "Log out",
    logoutConfirm: "Log out of the owner account?",
  },
  boardForm: {
    title: "Board name",
    titlePlaceholder: "e.g. Sprint Q3",
    titleDefault: "Project discussions",
    creating: "Creating…",
    create: "Create board",
    createdEyebrow: "Board ready",
    createdTitle: "Save this link",
    createdLede:
      "Everyone enters through this link — including you. Copy it, open it, and enter a name. Same name = same person.",
    linkLabel: "Board link",
    copyLink: "Copy link",
  },
  board: {
    youAre: "Signed in as",
    invite: "Copy link",
    inviting: "…",
    inviteHint: "Permanent join link — same name rejoins",
    copied: "Copied",
    replies: "{n} replies",
    stagesNav: "Board stages",
    logout: "Log out",
    logoutConfirm: "Log out of this board?",
    participantsAria: "People on this board",
    participantsTitle: "People on the board",
    participantsEmpty: "No one has joined yet.",
    joinedAt: "Joined",
    closeParticipants: "Close",
  },
  columns: {
    new: "New",
    in_progress: "In progress",
    answered: "Answered",
    done: "Done",
  },
  quickAdd: {
    trigger: "+ Quick item",
    title: "Title",
    titlePlaceholder: "Short title",
    urgent: "Urgent",
    saving: "Saving…",
    save: "Save",
    cancel: "Cancel",
  },
  invitePage: {
    eyebrow: "Invite",
    usedTitle: "Link already used",
    usedBody: "This personal invite is one-time. Ask the board owner for a new link to “{board}”.",
    joinLede: "Enter your name — you’re on the board. No registration needed.",
    nameLabel: "Your name on the board",
    namePlaceholder: "How should we call you",
    joining: "Joining…",
    join: "Join board",
  },
  joinPage: {
    eyebrow: "Board link",
    joinLede:
      "Enter your name. Use the same name as before to continue as yourself — unlimited times.",
    nameLabel: "Your name on the board",
    namePlaceholder: "How should we call you",
    joining: "Joining…",
    join: "Open board",
  },
  cardPage: {
    back: "← Back to board",
    close: "Close",
    stage: "Stage",
    priority: "Priority",
    markUrgent: "Mark as urgent",
    clearUrgent: "Remove urgency",
    urgentBadge: "Urgent",
    discussion: "Discussion",
    emptyThread: "No replies yet. Write the first one.",
    editTitle: "Title",
    attachments: "Photos & videos",
    attachmentsHint: "Up to 50 MB each",
    attachmentsEmpty: "Add a photo or a short video",
    attachmentsAdd: "Add file",
    attachmentsUploading: "Uploading…",
    attachmentOpen: "Open",
    attachmentRemove: "Remove",
    attachmentsUnavailable: "File storage is not configured",
    attachmentsLocalCard: "Wait until the card is saved, then attach files",
    attachmentClosePreview: "Close preview",
  },
  comment: {
    placeholder: "Write a reply or comment…",
    sending: "Sending…",
    send: "Send",
    attach: "Attach",
    attachAria: "Attach a photo or video",
  },
  notFound: {
    title: "Page not found",
    body: "The link is outdated, or the board does not exist.",
    home: "Home",
  },
  common: {
    stageAria: "Card stage",
  },
  errors: {
    validation: "Validation error",
    createOrganizer: "Could not create organizer",
    createBoard: "Could not create board",
    invalidBoard: "Invalid board",
    unauthorized: "No access to this board",
    createInvite: "Could not create invite",
    boardFull: "Board is full (20 people)",
    inviteNotFound: "Invite not found",
    inviteUsed: "This invite has already been used",
    createCard: "Could not create card",
    cardNotFound: "Card not found",
    moveCard: "Could not move card",
    updateCard: "Could not update card",
    addComment: "Could not add comment",
    joinFailed: "Could not join",
    invalidCredentials: "Invalid login or password",
    titleShort: "Name is too short",
    titleLong: "Name is too long",
    nameRequired: "Enter your name",
    nameLong: "Name is too long",
    cardTitleShort: "Title is too short",
    commentEmpty: "Write a comment or attach a file",
    storageNotConfigured: "File storage is not configured",
    fileTooLarge: "File is larger than 50 MB",
    fileTypeUnsupported: "Only photos and videos are allowed",
    uploadFailed: "Could not upload the file",
    attachmentLimit: "Too many files on this card",
    attachmentNotFound: "File not found",
    deleteAttachment: "Could not remove the file",
  },
};
