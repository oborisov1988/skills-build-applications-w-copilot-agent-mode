import mongoose from 'mongoose';
import { Activity, Team, User, Workout } from '../models/index.js';

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  if (!input || typeof input !== 'object') {
    throw Object.assign(new Error('Activity payload is required'), { status: 400 });
  }

  const payload = input as Record<string, unknown>;
  const { userId, teamId, type, minutes } = payload;

  if (typeof userId !== 'string' || !mongoose.Types.ObjectId.isValid(userId)) {
    throw Object.assign(new Error('userId must be a valid ObjectId'), { status: 400 });
  }

  if (typeof teamId !== 'string' || !mongoose.Types.ObjectId.isValid(teamId)) {
    throw Object.assign(new Error('teamId must be a valid ObjectId'), { status: 400 });
  }

  if (typeof type !== 'string' || !type.trim()) {
    throw Object.assign(new Error('type is required'), { status: 400 });
  }

  const parsedMinutes = Number(minutes);
  if (!Number.isFinite(parsedMinutes) || parsedMinutes <= 0) {
    throw Object.assign(new Error('minutes must be a positive number'), { status: 400 });
  }

  const user = await User.findById(userId);
  if (!user) {
    throw Object.assign(new Error('User not found'), { status: 400 });
  }

  const team = await Team.findById(teamId);
  if (!team) {
    throw Object.assign(new Error('Team not found'), { status: 400 });
  }

  const activity = await Activity.create({
    user: user._id,
    team: team._id,
    type: type.trim(),
    minutes: parsedMinutes,
    points: parsedMinutes,
    occurredAt: new Date(),
  });

  return activity.toObject();
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  if (!input || typeof input !== 'object') {
    throw Object.assign(new Error('Team payload is required'), { status: 400 });
  }

  const payload = input as Record<string, unknown>;
  const { name, mascot, members } = payload;

  if (typeof name !== 'string' || !name.trim()) {
    throw Object.assign(new Error('name is required'), { status: 400 });
  }

  if (typeof mascot !== 'string' || !mascot.trim()) {
    throw Object.assign(new Error('mascot is required'), { status: 400 });
  }

  const memberIds = Array.isArray(members) ? members : [];
  const validMemberIds = memberIds.filter((member) => typeof member === 'string' && mongoose.Types.ObjectId.isValid(member));

  const team = await Team.create({
    name: name.trim(),
    mascot: mascot.trim(),
    members: validMemberIds,
  });

  return team.toObject();
}

export async function getLeaderboard() {
  const rows = await Activity.aggregate([
    { $group: { _id: '$team', totalPoints: { $sum: '$points' } } },
    { $sort: { totalPoints: -1, _id: 1 } },
  ]);

  const teamsById = new Map<string, string>();
  const teamDocs = await Team.find({ _id: { $in: rows.map((row) => row._id) } }).lean();
  for (const team of teamDocs) {
    teamsById.set(team._id.toString(), team.name);
  }

  return rows.map((row, index) => ({
    teamName: teamsById.get(row._id.toString()) ?? 'Unknown team',
    totalPoints: row.totalPoints,
    rank: index + 1,
  }));
}

export async function suggestWorkouts(userEmail: string) {
  const user = await User.findOne({ email: new RegExp(`^${userEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') });
  if (!user) {
    throw Object.assign(new Error('User not found'), { status: 404 });
  }

  const recentActivities = await Activity.find({ user: user._id }).sort({ occurredAt: -1 }).lean();
  const latestType = (recentActivities[0]?.type ?? '').toString().toLowerCase();
  const goal = (user.fitnessGoal ?? '').toString().toLowerCase();

  const patternFocus = (() => {
    if (['run', 'cycle', 'walk', 'cardio', 'endurance'].includes(latestType)) {
      return 'endurance';
    }
    if (['strength', 'lift', 'power'].includes(latestType)) {
      return 'strength';
    }
    if (['mobility', 'stretch', 'yoga'].includes(latestType)) {
      return 'mobility';
    }
    if (['strength', 'endurance', 'mobility'].includes(goal)) {
      return goal;
    }
    return 'endurance';
  })();

  const workouts = await Workout.find().lean();
  const ranked = workouts
    .map((workout) => {
      const focus = String(workout.focus ?? '').toLowerCase();
      let score = 0;
      if (focus === patternFocus) score += 5;
      if (focus === goal) score += 3;
      if (workout.title && latestType && workout.title.toLowerCase().includes(latestType)) score += 1;
      return { workout, score };
    })
    .sort((left, right) => right.score - left.score || left.workout.title.localeCompare(right.workout.title))
    .map(({ workout, score }) => ({
      ...workout,
      reason: (() => {
        if (score >= 5 && (patternFocus === goal || focusMatchesGoal(workout, patternFocus, goal))) {
          return `Matches your ${patternFocus} goal and recent ${latestType || 'activity'} pattern.`;
        }
        if (focusMatchesGoal(workout, patternFocus, goal)) {
          return `Matches your ${patternFocus} pattern and recent ${latestType || 'activity'} activity.`;
        }
        if (goal && String(workout.focus ?? '').toLowerCase() === goal) {
          return `Matches your ${goal} goal.`;
        }
        return `Builds on your recent ${latestType || 'activity'} pattern.`;
      })(),
    }));

  return ranked;
}

function focusMatchesGoal(workout: { focus?: string | null }, patternFocus: string, goal: string) {
  return String(workout.focus ?? '').toLowerCase() === patternFocus || String(workout.focus ?? '').toLowerCase() === goal;
}

export { User };
