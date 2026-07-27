export type Dictionary = {
  meta: {
    description: string;
  };
  home: {
    eyebrow: string;
    lede: string;
  };
  boardForm: {
    title: string;
    titlePlaceholder: string;
    titleDefault: string;
    yourName: string;
    namePlaceholder: string;
    creating: string;
    create: string;
    createdEyebrow: string;
    createdTitle: string;
    createdLede: string;
    linkLabel: string;
    copyLink: string;
    openBoard: string;
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
  cardTypes: {
    question: string;
    task: string;
  };
  quickAdd: {
    trigger: string;
    title: string;
    titlePlaceholder: string;
    type: string;
    description: string;
    descriptionPlaceholder: string;
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
    noDescription: string;
    stage: string;
    priority: string;
    markUrgent: string;
    clearUrgent: string;
    urgentBadge: string;
    discussion: string;
    emptyThread: string;
    editTitle: string;
    editDescription: string;
    saveChanges: string;
    savingChanges: string;
  };
  comment: {
    placeholder: string;
    sending: string;
    send: string;
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
    titleShort: string;
    titleLong: string;
    nameRequired: string;
    nameLong: string;
    cardTitleShort: string;
    commentEmpty: string;
  };
};

export const en: Dictionary = {
  meta: {
    description: "Public Kanban board via a reusable join link — no registration",
  },
  home: {
    eyebrow: "No registration",
    lede: "One shared board for questions and tasks. Create a board, tap Invite — copy the permanent link, send it to a teammate. Same name = same person.",
  },
  boardForm: {
    title: "Board name",
    titlePlaceholder: "e.g. Sprint Q3",
    titleDefault: "Project discussions",
    yourName: "Your name",
    namePlaceholder: "How others see you on the board",
    creating: "Creating…",
    create: "Create board",
    createdEyebrow: "Board ready",
    createdTitle: "Save this link",
    createdLede:
      "This is the permanent entry link. Bookmark it or send it to teammates. Same name = same person — including you after redeploy.",
    linkLabel: "Join link",
    copyLink: "Copy link",
    openBoard: "Open board",
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
  cardTypes: {
    question: "Question",
    task: "Task",
  },
  quickAdd: {
    trigger: "+ Quick item",
    title: "Title",
    titlePlaceholder: "Short question or task",
    type: "Type",
    description: "Description",
    descriptionPlaceholder: "Optional",
    urgent: "Urgent / important",
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
    noDescription: "No description yet.",
    stage: "Stage",
    priority: "Priority",
    markUrgent: "Mark as urgent",
    clearUrgent: "Remove urgency",
    urgentBadge: "Urgent",
    discussion: "Discussion",
    emptyThread: "No replies yet. Write the first one.",
    editTitle: "Title",
    editDescription: "Description",
    saveChanges: "Save changes",
    savingChanges: "Saving…",
  },
  comment: {
    placeholder: "Write a reply or comment…",
    sending: "Sending…",
    send: "Send",
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
    titleShort: "Name is too short",
    titleLong: "Name is too long",
    nameRequired: "Enter your name",
    nameLong: "Name is too long",
    cardTitleShort: "Title is too short",
    commentEmpty: "Comment is empty",
  },
};
