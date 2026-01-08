# Schéma du Modèle de Données - TennisMatchFinder

**Date** : 8 janvier 2026  
**Version** : 1.0  
**Source** : `/src/lib/db/schema.ts`

---

## Vue d'ensemble

```
                                    TennisMatchFinder
                                   Modèle de Données
                                    27 Tables | 15 Enums
                                    
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │                         AUTHENTIFICATION (NextAuth)                          │   │
│  │                                                                              │   │
│  │   ┌────────────┐    ┌────────────┐    ┌────────────┐    ┌────────────────┐  │   │
│  │   │   users    │───▶│  accounts  │    │  sessions  │    │ verification   │  │   │
│  │   │            │    │  (OAuth)   │    │            │    │    _tokens     │  │   │
│  │   └─────┬──────┘    └────────────┘    └────────────┘    └────────────────┘  │   │
│  │         │                                                                    │   │
│  └─────────┼────────────────────────────────────────────────────────────────────┘   │
│            │                                                                        │
│            │ 1:1                                                                    │
│            ▼                                                                        │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │                              JOUEURS & CLUBS                                 │   │
│  │                                                                              │   │
│  │   ┌────────────┐    N:1    ┌────────────┐                                   │   │
│  │   │  players   │◀─────────▶│   clubs    │                                   │   │
│  │   │ (profils)  │           │ (settings) │                                   │   │
│  │   └─────┬──────┘           └─────┬──────┘                                   │   │
│  │         │                        │                                          │   │
│  │         │                        │                                          │   │
│  │         │              ┌─────────┴─────────┐                                │   │
│  │         │              ▼                   ▼                                │   │
│  │         │    ┌────────────────┐   ┌────────────────┐                       │   │
│  │         │    │club_join_     │   │club_creation_  │                       │   │
│  │         │    │requests       │   │requests        │                       │   │
│  │         │    └────────────────┘   └────────────────┘                       │   │
│  │         │                                                                   │   │
│  └─────────┼───────────────────────────────────────────────────────────────────┘   │
│            │                                                                        │
│            │                                                                        │
│  ┌─────────┼───────────────────────────────────────────────────────────────────┐   │
│  │         │                       MATCHS & ELO                                 │   │
│  │         │                                                                    │   │
│  │         │           ┌────────────┐         ┌────────────────┐               │   │
│  │         ├──────────▶│  matches   │────────▶│  elo_history   │               │   │
│  │         │           │ (résultats)│         │  (tracking)    │               │   │
│  │         │           └────────────┘         └────────────────┘               │   │
│  │         │                                                                    │   │
│  │         │           ┌──────────────────┐                                    │   │
│  │         └──────────▶│ match_proposals  │                                    │   │
│  │                     │  (invitations)   │                                    │   │
│  │                     └──────────────────┘                                    │   │
│  │                                                                              │   │
│  └──────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                     │
│  ┌──────────────────────────────────────────────────────────────────────────────┐   │
│  │                              MATCH NOW                                        │   │
│  │                                                                               │   │
│  │   ┌────────────────────────┐         ┌────────────────────────┐              │   │
│  │   │ match_now_availability │────────▶│  match_now_responses   │              │   │
│  │   │   (disponibilités)     │         │     (réponses)         │              │   │
│  │   └────────────────────────┘         └────────────────────────┘              │   │
│  │                                                                               │   │
│  └──────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                     │
│  ┌──────────────────────────────────────────────────────────────────────────────┐   │
│  │                                 FORUM                                         │   │
│  │                                                                               │   │
│  │   ┌────────────────┐    1:N    ┌────────────────┐                            │   │
│  │   │ forum_threads  │──────────▶│ forum_replies  │                            │   │
│  │   │    (posts)     │           │  (comments)    │                            │   │
│  │   └────────┬───────┘           └────────────────┘                            │   │
│  │            │                                                                  │   │
│  │            │ 1:N                                                             │   │
│  │            ▼                                                                  │   │
│  │   ┌────────────────┐                                                         │   │
│  │   │forum_reactions │                                                         │   │
│  │   │   (emojis)     │                                                         │   │
│  │   └────────────────┘                                                         │   │
│  │                                                                               │   │
│  └──────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                     │
│  ┌──────────────────────────────────────────────────────────────────────────────┐   │
│  │                                  CHAT                                         │   │
│  │                                                                               │   │
│  │   ┌────────────────┐    1:N    ┌──────────────────┐                          │   │
│  │   │  chat_rooms    │──────────▶│chat_room_members │                          │   │
│  │   │  (sections)    │           │                  │                          │   │
│  │   └────────┬───────┘           └──────────────────┘                          │   │
│  │            │                                                                  │   │
│  │            │ 1:N                                                             │   │
│  │            ▼                                                                  │   │
│  │   ┌────────────────┐                                                         │   │
│  │   │ chat_messages  │                                                         │   │
│  │   │ (éphémères 24h)│                                                         │   │
│  │   └────────────────┘                                                         │   │
│  │                                                                               │   │
│  └──────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                     │
│  ┌──────────────────────────────────────────────────────────────────────────────┐   │
│  │                            BOX LEAGUES                                        │   │
│  │                                                                               │   │
│  │   ┌────────────────┐    1:N    ┌───────────────────────┐                     │   │
│  │   │  box_leagues   │──────────▶│box_league_participants│                     │   │
│  │   │  (mensuel)     │           │    (inscriptions)     │                     │   │
│  │   └────────┬───────┘           └───────────────────────┘                     │   │
│  │            │                                                                  │   │
│  │            │ 1:N                                                             │   │
│  │            ▼                                                                  │   │
│  │   ┌────────────────────┐                                                     │   │
│  │   │box_league_matches  │                                                     │   │
│  │   │  (round-robin)     │                                                     │   │
│  │   └────────────────────┘                                                     │   │
│  │                                                                               │   │
│  └──────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                     │
│  ┌──────────────────────────────────────────────────────────────────────────────┐   │
│  │                              TOURNOIS                                         │   │
│  │                                                                               │   │
│  │   ┌────────────────┐    1:N    ┌────────────────────────┐                    │   │
│  │   │  tournaments   │──────────▶│tournament_participants │                    │   │
│  │   │ (élimination)  │           │    (inscriptions)      │                    │   │
│  │   └────────┬───────┘           └────────────────────────┘                    │   │
│  │            │                                                                  │   │
│  │            │ 1:N                                                             │   │
│  │            ▼                                                                  │   │
│  │   ┌────────────────────┐       ┌────────────────────┐                        │   │
│  │   │tournament_matches  │──────▶│  tournament_matches │  (nextMatchId)        │   │
│  │   │    (bracket)       │       │     (suivant)       │                       │   │
│  │   └────────────────────┘       └────────────────────┘                        │   │
│  │                                                                               │   │
│  └──────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                     │
│  ┌──────────────────────────────────────────────────────────────────────────────┐   │
│  │                         ABONNEMENTS & AUTRES                                  │   │
│  │                                                                               │   │
│  │   ┌────────────────┐    1:N    ┌────────────────┐                            │   │
│  │   │ subscriptions  │──────────▶│   payments     │                            │   │
│  │   │   (Stripe)     │           │  (historique)  │                            │   │
│  │   └────────────────┘           └────────────────┘                            │   │
│  │                                                                               │   │
│  │   ┌────────────────┐           ┌────────────────┐                            │   │
│  │   │ notifications  │           │ player_badges  │                            │   │
│  │   │   (in-app)     │           │ (achievements) │                            │   │
│  │   └────────────────┘           └────────────────┘                            │   │
│  │                                                                               │   │
│  └──────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                     │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Diagramme Entité-Relation détaillé

### 1. Authentification

```
┌────────────────────────────────────┐
│              users                  │
├────────────────────────────────────┤
│ PK  id            UUID             │
│     name          VARCHAR(255)     │
│     email         VARCHAR(255) UQ  │
│     emailVerified TIMESTAMP        │
│     image         TEXT             │
│     createdAt     TIMESTAMP        │
│     updatedAt     TIMESTAMP        │
└─────────────┬──────────────────────┘
              │
              │ 1
              │
      ┌───────┴───────┬────────────────┐
      │               │                │
      ▼ N             ▼ N              ▼ 1
┌─────────────┐ ┌──────────────┐ ┌─────────────┐
│  accounts   │ │   sessions   │ │   players   │
├─────────────┤ ├──────────────┤ ├─────────────┤
│ PK id       │ │ PK id        │ │ (voir ci-   │
│ FK userId   │ │ FK userId    │ │  dessous)   │
│    provider │ │    expires   │ │             │
│    ...      │ │    ...       │ │             │
└─────────────┘ └──────────────┘ └─────────────┘
```

### 2. Joueurs & Clubs

```
┌────────────────────────────────────────────────────┐
│                      clubs                          │
├────────────────────────────────────────────────────┤
│ PK  id              UUID                           │
│     name            VARCHAR(255) NOT NULL          │
│     slug            VARCHAR(255) UNIQUE NOT NULL   │
│     description     TEXT                           │
│     logoUrl         TEXT                           │
│     bannerUrl       TEXT                           │
│     settings        JSONB DEFAULT '{}'             │
│     isActive        BOOLEAN DEFAULT TRUE           │
│     createdAt       TIMESTAMP                      │
│     updatedAt       TIMESTAMP                      │
└──────────────────────┬─────────────────────────────┘
                       │
                       │ 1
                       │
                       ▼ N
┌────────────────────────────────────────────────────────────────┐
│                         players                                 │
├────────────────────────────────────────────────────────────────┤
│ PK  id                UUID REFERENCES users(id)                │
│ FK  clubId            UUID REFERENCES clubs(id) NOT NULL       │
│     fullName          VARCHAR(255) NOT NULL                    │
│     phone             VARCHAR(20)                              │
│     bio               TEXT                                     │
│     profilePictureUrl TEXT                                     │
│                                                                │
│     -- ELO System --                                           │
│     currentElo        INTEGER DEFAULT 1200                     │
│     bestElo           INTEGER DEFAULT 1200                     │
│     lowestElo         INTEGER DEFAULT 1200                     │
│     selfAssessedLevel player_level_enum                        │
│                                                                │
│     -- Disponibilités (JSONB) --                               │
│     availability      JSONB DEFAULT '[]'                       │
│     preferences       JSONB DEFAULT '{}'                       │
│                                                                │
│     -- Statistiques --                                         │
│     matchesPlayed     INTEGER DEFAULT 0                        │
│     wins              INTEGER DEFAULT 0                        │
│     losses            INTEGER DEFAULT 0                        │
│     winStreak         INTEGER DEFAULT 0                        │
│     bestWinStreak     INTEGER DEFAULT 0                        │
│     uniqueOpponents   INTEGER DEFAULT 0                        │
│                                                                │
│     -- Flags --                                                │
│     isAdmin           BOOLEAN DEFAULT FALSE                    │
│     isVerified        BOOLEAN DEFAULT FALSE                    │
│     isActive          BOOLEAN DEFAULT TRUE                     │
│     lastActiveAt      TIMESTAMP                                │
│                                                                │
│     createdAt         TIMESTAMP                                │
│     updatedAt         TIMESTAMP                                │
├────────────────────────────────────────────────────────────────┤
│ IDX idx_players_clubId     (clubId)                            │
│ IDX idx_players_currentElo (currentElo)                        │
└────────────────────────────────────────────────────────────────┘
```

### 3. Matchs

```
┌────────────────────────────────────────────────────────────────┐
│                          matches                                │
├────────────────────────────────────────────────────────────────┤
│ PK  id                UUID                                     │
│ FK  clubId            UUID REFERENCES clubs(id) NOT NULL       │
│ FK  player1Id         UUID REFERENCES players(id) NOT NULL     │
│ FK  player2Id         UUID REFERENCES players(id) NOT NULL     │
│ FK  winnerId          UUID REFERENCES players(id)              │
│                                                                │
│     score             VARCHAR(50) NOT NULL                     │
│     gameType          game_type_enum                           │
│     surface           court_surface_enum                       │
│     location          VARCHAR(255)                             │
│     notes             TEXT                                     │
│                                                                │
│     -- ELO tracking --                                         │
│     player1EloBefore  INTEGER                                  │
│     player1EloAfter   INTEGER                                  │
│     player2EloBefore  INTEGER                                  │
│     player2EloAfter   INTEGER                                  │
│     modifiersApplied  JSONB DEFAULT '{}'                       │
│                                                                │
│     -- Validation --                                           │
│     validated         BOOLEAN DEFAULT FALSE                    │
│ FK  validatedBy       UUID REFERENCES players(id)              │
│     validatedAt       TIMESTAMP                                │
│                                                                │
│     playedAt          TIMESTAMP NOT NULL                       │
│     createdAt         TIMESTAMP                                │
├────────────────────────────────────────────────────────────────┤
│ IDX idx_matches_clubId   (clubId)                              │
│ IDX idx_matches_playedAt (playedAt)                            │
└────────────────────────────────────────────────────────────────┘
                       │
                       │ 1
                       │
                       ▼ N
┌────────────────────────────────────────────────────────────────┐
│                       elo_history                               │
├────────────────────────────────────────────────────────────────┤
│ PK  id              UUID                                       │
│ FK  playerId        UUID REFERENCES players(id) NOT NULL       │
│ FK  matchId         UUID REFERENCES matches(id)                │
│     elo             INTEGER NOT NULL                           │
│     delta           INTEGER NOT NULL                           │
│     reason          elo_change_reason_enum                     │
│     metadata        JSONB DEFAULT '{}'                         │
│     recordedAt      TIMESTAMP                                  │
├────────────────────────────────────────────────────────────────┤
│ IDX idx_elo_history_playerId (playerId)                        │
└────────────────────────────────────────────────────────────────┘
```

### 4. Propositions de match

```
┌────────────────────────────────────────────────────────────────┐
│                      match_proposals                            │
├────────────────────────────────────────────────────────────────┤
│ PK  id              UUID                                       │
│ FK  clubId          UUID REFERENCES clubs(id) NOT NULL         │
│ FK  fromPlayerId    UUID REFERENCES players(id) NOT NULL       │
│ FK  toPlayerId      UUID REFERENCES players(id) NOT NULL       │
│     proposedDate    DATE NOT NULL                              │
│     proposedTime    VARCHAR(10)                                │
│     message         TEXT                                       │
│     status          proposal_status_enum DEFAULT 'pending'     │
│     createdAt       TIMESTAMP                                  │
│     updatedAt       TIMESTAMP                                  │
├────────────────────────────────────────────────────────────────┤
│ IDX idx_proposals_clubId (clubId)                              │
│ IDX idx_proposals_status (status)                              │
└────────────────────────────────────────────────────────────────┘
```

### 5. Compétitions - Box Leagues

```
┌────────────────────────────────────────────────────────────────┐
│                        box_leagues                              │
├────────────────────────────────────────────────────────────────┤
│ PK  id                    UUID                                 │
│ FK  clubId                UUID REFERENCES clubs(id) NOT NULL   │
│     name                  VARCHAR(255) NOT NULL                │
│     description           TEXT                                 │
│     startDate             DATE NOT NULL                        │
│     endDate               DATE NOT NULL                        │
│     registrationDeadline  DATE                                 │
│     minElo                INTEGER                              │
│     maxElo                INTEGER                              │
│     maxParticipants       INTEGER                              │
│     division              VARCHAR(50)                          │
│     scoringRules          JSONB DEFAULT '{}'                   │
│     promotionCount        INTEGER DEFAULT 2                    │
│     relegationCount       INTEGER DEFAULT 2                    │
│     status                box_league_status_enum DEFAULT 'draft'│
│     createdAt             TIMESTAMP                            │
│     updatedAt             TIMESTAMP                            │
└──────────────────────┬─────────────────────────────────────────┘
                       │
           ┌───────────┴───────────┐
           │                       │
           ▼ N                     ▼ N
┌──────────────────────┐ ┌──────────────────────────┐
│box_league_participants│ │  box_league_matches      │
├──────────────────────┤ ├──────────────────────────┤
│ PK id                │ │ PK id                    │
│ FK leagueId          │ │ FK leagueId              │
│ FK playerId          │ │ FK player1Id             │
│    eloAtStart        │ │ FK player2Id             │
│    matchesPlayed     │ │ FK winnerId              │
│    matchesWon        │ │    round                 │
│    matchesLost       │ │    score                 │
│    setsWon           │ │    setsWon1/2            │
│    setsLost          │ │    gamesWon1/2           │
│    gamesWon          │ │    status                │
│    gamesLost         │ │    playedAt              │
│    points            │ │    ...                   │
│    finalRank         │ └──────────────────────────┘
│    isPromoted        │
│    isRelegated       │
│    ...               │
└──────────────────────┘
```

### 6. Compétitions - Tournois

```
┌────────────────────────────────────────────────────────────────┐
│                        tournaments                              │
├────────────────────────────────────────────────────────────────┤
│ PK  id                    UUID                                 │
│ FK  clubId                UUID REFERENCES clubs(id) NOT NULL   │
│     name                  VARCHAR(255) NOT NULL                │
│     description           TEXT                                 │
│     format                tournament_format_enum               │
│     startDate             DATE NOT NULL                        │
│     endDate               DATE                                 │
│     registrationDeadline  DATE                                 │
│     minElo                INTEGER                              │
│     maxElo                INTEGER                              │
│     minParticipants       INTEGER DEFAULT 4                    │
│     maxParticipants       INTEGER                              │
│     setsToWin             INTEGER DEFAULT 2                    │
│     finalSetsToWin        INTEGER DEFAULT 2                    │
│     thirdPlaceMatch       BOOLEAN DEFAULT FALSE                │
│     seedingMethod         VARCHAR(20) DEFAULT 'elo'            │
│     entryFee              INTEGER DEFAULT 0                    │
│     currency              VARCHAR(3) DEFAULT 'EUR'             │
│     prizePool             JSONB                                │
│ FK  winnerId              UUID REFERENCES players(id)          │
│ FK  runnerUpId            UUID REFERENCES players(id)          │
│ FK  thirdPlaceId          UUID REFERENCES players(id)          │
│     currentRound          INTEGER                              │
│     totalRounds           INTEGER                              │
│     bracketSize           INTEGER                              │
│     status                tournament_status_enum DEFAULT 'draft'│
│     createdAt             TIMESTAMP                            │
│     updatedAt             TIMESTAMP                            │
└──────────────────────┬─────────────────────────────────────────┘
                       │
           ┌───────────┴───────────┐
           │                       │
           ▼ N                     ▼ N
┌──────────────────────────┐ ┌──────────────────────────────────────┐
│tournament_participants   │ │     tournament_matches               │
├──────────────────────────┤ ├──────────────────────────────────────┤
│ PK id                    │ │ PK id                                │
│ FK tournamentId          │ │ FK tournamentId                      │
│ FK playerId              │ │ FK player1Id (nullable - BYE)        │
│    seed                  │ │ FK player2Id (nullable - BYE)        │
│    eloAtRegistration     │ │ FK winnerId                          │
│    eliminatedInRound     │ │    round                             │
│    finalPosition         │ │    matchNumber                       │
│    paymentStatus         │ │    position                          │
│    stripePaymentId       │ │    score                             │
│    registeredAt          │ │    sets                              │
│    ...                   │ │ FK nextMatchId (auto-link bracket)   │
└──────────────────────────┘ │    status                            │
                             │    scheduledAt                       │
                             │    playedAt                          │
                             │    isConsolation                     │
                             │    ...                               │
                             └──────────────────────────────────────┘
```

### 7. Communication - Chat

```
┌────────────────────────────────────────────────────────────────┐
│                        chat_rooms                               │
├────────────────────────────────────────────────────────────────┤
│ PK  id              UUID                                       │
│ FK  clubId          UUID REFERENCES clubs(id) NOT NULL         │
│     name            VARCHAR(255) NOT NULL                      │
│     description     TEXT                                       │
│     type            VARCHAR(20) DEFAULT 'section'              │
│                     -- 'section' | 'direct' | 'group' --       │
│     isDirect        BOOLEAN DEFAULT FALSE                      │
│     isActive        BOOLEAN DEFAULT TRUE                       │
│     createdAt       TIMESTAMP                                  │
│     updatedAt       TIMESTAMP                                  │
└──────────────────────┬─────────────────────────────────────────┘
                       │
           ┌───────────┴───────────┐
           │                       │
           ▼ N                     ▼ N
┌──────────────────────┐ ┌──────────────────────────┐
│ chat_room_members    │ │    chat_messages         │
├──────────────────────┤ ├──────────────────────────┤
│ PK id                │ │ PK id                    │
│ FK roomId            │ │ FK roomId                │
│ FK playerId          │ │ FK senderId              │
│    joinedAt          │ │    content               │
│    lastReadAt        │ │    type DEFAULT 'text'   │
│    ...               │ │    metadata JSONB        │
└──────────────────────┘ │    createdAt             │
                         │    -- éphémères 24h --   │
                         └──────────────────────────┘
```

### 8. Communication - Forum

```
┌────────────────────────────────────────────────────────────────┐
│                       forum_threads                             │
├────────────────────────────────────────────────────────────────┤
│ PK  id              UUID                                       │
│ FK  clubId          UUID REFERENCES clubs(id) NOT NULL         │
│ FK  authorId        UUID REFERENCES players(id) NOT NULL       │
│     title           VARCHAR(255) NOT NULL                      │
│     content         TEXT NOT NULL                              │
│     category        forum_category_enum                        │
│     viewCount       INTEGER DEFAULT 0                          │
│     replyCount      INTEGER DEFAULT 0                          │
│     isPinned        BOOLEAN DEFAULT FALSE                      │
│     isLocked        BOOLEAN DEFAULT FALSE                      │
│     isBot           BOOLEAN DEFAULT FALSE                      │
│     createdAt       TIMESTAMP                                  │
│     updatedAt       TIMESTAMP                                  │
└──────────────────────┬─────────────────────────────────────────┘
                       │
           ┌───────────┴───────────┐
           │                       │
           ▼ N                     ▼ N
┌──────────────────────┐ ┌──────────────────────────┐
│   forum_replies      │ │   forum_reactions        │
├──────────────────────┤ ├──────────────────────────┤
│ PK id                │ │ PK id                    │
│ FK threadId          │ │ FK threadId              │
│ FK authorId          │ │ FK replyId (nullable)    │
│ FK parentReplyId     │ │ FK playerId              │
│    content           │ │    emoji                 │
│    isBot             │ │    createdAt             │
│    createdAt         │ └──────────────────────────┘
│    updatedAt         │
└──────────────────────┘
```

### 9. Abonnements & Paiements

```
┌────────────────────────────────────────────────────────────────┐
│                       subscriptions                             │
├────────────────────────────────────────────────────────────────┤
│ PK  id                    UUID                                 │
│ FK  userId                UUID REFERENCES users(id) NOT NULL   │
│     stripeCustomerId      VARCHAR(255)                         │
│     stripeSubscriptionId  VARCHAR(255)                         │
│     stripePriceId         VARCHAR(255)                         │
│     tier                  subscription_tier_enum DEFAULT 'free'│
│     status                subscription_status_enum             │
│     currentPeriodStart    TIMESTAMP                            │
│     currentPeriodEnd      TIMESTAMP                            │
│     cancelAtPeriodEnd     BOOLEAN DEFAULT FALSE                │
│     createdAt             TIMESTAMP                            │
│     updatedAt             TIMESTAMP                            │
└──────────────────────┬─────────────────────────────────────────┘
                       │
                       │ 1
                       ▼ N
┌────────────────────────────────────────────────────────────────┐
│                         payments                                │
├────────────────────────────────────────────────────────────────┤
│ PK  id                    UUID                                 │
│ FK  subscriptionId        UUID REFERENCES subscriptions(id)    │
│     stripePaymentIntentId VARCHAR(255)                         │
│     amount                INTEGER NOT NULL  -- cents           │
│     currency              VARCHAR(3) DEFAULT 'EUR'             │
│     status                VARCHAR(50)                          │
│     paidAt                TIMESTAMP                            │
│     createdAt             TIMESTAMP                            │
└────────────────────────────────────────────────────────────────┘
```

### 10. Gamification & Notifications

```
┌────────────────────────────────────────────────────────────────┐
│                       player_badges                             │
├────────────────────────────────────────────────────────────────┤
│ PK  id                UUID                                     │
│ FK  playerId          UUID REFERENCES players(id) NOT NULL     │
│     badgeType         VARCHAR(50) NOT NULL                     │
│     badgeName         VARCHAR(100) NOT NULL                    │
│     badgeDescription  TEXT                                     │
│     badgeIcon         VARCHAR(50)                              │
│     earnedAt          TIMESTAMP NOT NULL                       │
│     createdAt         TIMESTAMP                                │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│                       notifications                             │
├────────────────────────────────────────────────────────────────┤
│ PK  id                UUID                                     │
│ FK  playerId          UUID REFERENCES players(id) NOT NULL     │
│     type              VARCHAR(50) NOT NULL                     │
│     title             VARCHAR(255) NOT NULL                    │
│     message           TEXT NOT NULL                            │
│     link              VARCHAR(255)                             │
│     metadata          JSONB DEFAULT '{}'                       │
│     isRead            BOOLEAN DEFAULT FALSE                    │
│     createdAt         TIMESTAMP                                │
└────────────────────────────────────────────────────────────────┘
```

---

## Enums

### Liste complète des 15 enums

```sql
-- Niveaux de joueur
CREATE TYPE player_level_enum AS ENUM (
  'débutant', 'intermédiaire', 'avancé', 'expert'
);

-- Types de match
CREATE TYPE game_type_enum AS ENUM (
  'simple', 'double'
);

-- Surfaces de court
CREATE TYPE court_surface_enum AS ENUM (
  'terre_battue', 'dur', 'gazon', 'indoor'
);

-- Jours de la semaine
CREATE TYPE weekday_enum AS ENUM (
  'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'
);

-- Créneaux horaires
CREATE TYPE time_slot_enum AS ENUM (
  'matin', 'midi', 'après-midi', 'soir'
);

-- Catégories forum
CREATE TYPE forum_category_enum AS ENUM (
  'général', 'recherche-partenaire', 'résultats', 'équipement', 'annonces'
);

-- Statut propositions
CREATE TYPE proposal_status_enum AS ENUM (
  'pending', 'accepted', 'declined', 'expired'
);

-- Raisons changement ELO
CREATE TYPE elo_change_reason_enum AS ENUM (
  'match_win', 'match_loss', 'inactivity_decay', 'manual_adjustment'
);

-- Statut demandes adhésion
CREATE TYPE join_request_status_enum AS ENUM (
  'pending', 'approved', 'rejected'
);

-- Statut création club
CREATE TYPE club_creation_status_enum AS ENUM (
  'pending', 'approved', 'rejected'
);

-- Statut abonnement Stripe
CREATE TYPE subscription_status_enum AS ENUM (
  'active', 'canceled', 'incomplete', 'incomplete_expired', 
  'past_due', 'trialing', 'unpaid'
);

-- Niveaux abonnement
CREATE TYPE subscription_tier_enum AS ENUM (
  'free', 'premium', 'pro'
);

-- Statut Box League
CREATE TYPE box_league_status_enum AS ENUM (
  'draft', 'registration', 'active', 'completed', 'cancelled'
);

-- Statut tournoi
CREATE TYPE tournament_status_enum AS ENUM (
  'draft', 'registration', 'seeding', 'active', 'completed', 'cancelled'
);

-- Format tournoi
CREATE TYPE tournament_format_enum AS ENUM (
  'single_elimination', 'double_elimination', 'consolation'
);
```

---

## Index de performance

### Index principaux

| Table | Index | Colonnes | Usage |
|-------|-------|----------|-------|
| players | idx_players_clubId | clubId | Filtrage par club |
| players | idx_players_currentElo | currentElo | Tri classement |
| matches | idx_matches_clubId | clubId | Filtrage par club |
| matches | idx_matches_playedAt | playedAt | Tri chronologique |
| elo_history | idx_elo_history_playerId | playerId | Historique joueur |
| match_proposals | idx_proposals_clubId | clubId | Filtrage |
| match_proposals | idx_proposals_status | status | Filtrage pending |
| forum_threads | idx_threads_clubId | clubId | Filtrage |
| chat_messages | idx_messages_roomId | roomId | Messages salon |

---

## Relations résumées

```
users ──────────────────────────┬─ 1:1 ─▶ players
                                ├─ 1:N ─▶ accounts
                                ├─ 1:N ─▶ sessions
                                └─ 1:1 ─▶ subscriptions

clubs ──────────────────────────┬─ 1:N ─▶ players
                                ├─ 1:N ─▶ matches
                                ├─ 1:N ─▶ match_proposals
                                ├─ 1:N ─▶ forum_threads
                                ├─ 1:N ─▶ chat_rooms
                                ├─ 1:N ─▶ box_leagues
                                ├─ 1:N ─▶ tournaments
                                └─ 1:N ─▶ club_join_requests

players ────────────────────────┬─ 1:N ─▶ matches (player1, player2, winner)
                                ├─ 1:N ─▶ elo_history
                                ├─ 1:N ─▶ match_proposals
                                ├─ 1:N ─▶ player_badges
                                ├─ 1:N ─▶ notifications
                                ├─ 1:N ─▶ forum_threads
                                ├─ 1:N ─▶ forum_replies
                                ├─ 1:N ─▶ chat_messages
                                ├─ N:M ─▶ chat_rooms (via chat_room_members)
                                ├─ 1:N ─▶ box_league_participants
                                └─ 1:N ─▶ tournament_participants

matches ────────────────────────└─ 1:N ─▶ elo_history

subscriptions ──────────────────└─ 1:N ─▶ payments

box_leagues ────────────────────┬─ 1:N ─▶ box_league_participants
                                └─ 1:N ─▶ box_league_matches

tournaments ────────────────────┬─ 1:N ─▶ tournament_participants
                                └─ 1:N ─▶ tournament_matches
                                         └─ self-ref ─▶ nextMatchId

forum_threads ──────────────────┬─ 1:N ─▶ forum_replies
                                └─ 1:N ─▶ forum_reactions

chat_rooms ─────────────────────┬─ 1:N ─▶ chat_room_members
                                └─ 1:N ─▶ chat_messages
```

---

## Notes importantes

### Multi-tenant par clubId

Toutes les tables métier sont isolées par `clubId` :
- Un joueur appartient à **un seul club**
- Les classements, forums, chats sont **séparés par club**
- L'ELO est **calculé par club** (pas global)

### Données JSONB

| Table | Colonne | Structure |
|-------|---------|-----------|
| players | availability | `[{day: "lundi", slots: ["matin", "soir"]}]` |
| players | preferences | `{gameTypes: ["simple"], surfaces: ["dur"]}` |
| matches | modifiersApplied | `{new_opponent: 1.15, upset: 1.20}` |
| clubs | settings | `{theme: "light", notifications: true}` |
| box_leagues | scoringRules | `{win: 3, draw: 1, loss: 0}` |

### Messages éphémères

Les messages chat (`chat_messages`) sont supprimés après 24h via le job cron `/api/cron/cleanup-chat`.

---

*Schéma généré le 8 janvier 2026*  
*Source : analyse du fichier `/src/lib/db/schema.ts`*
