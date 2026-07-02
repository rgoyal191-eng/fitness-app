export const C = {
  bg: "#0B0E11", surface: "#13181E", card: "#191F27", border: "#232B35",
  accent: "#3BFFAE", accentDim: "#0D2E22", accentText: "#0B0E11",
  amber: "#FFB627", amberDim: "#2E1F05",
  red: "#FF4D4D", redDim: "#2E0A0A",
  blue: "#4DA6FF", blueDim: "#0A1A2E",
  muted: "#5A6675", text: "#E2E8F0", soft: "#8A97A8",
};

export const EXERCISE_LIBRARY = {
  "Flat Barbell Bench Press": { muscle: "Chest", swaps: ["Flat Dumbbell Press", "Machine Chest Press", "Push-Ups (weighted)", "Smith Machine Bench"] },
  "Incline Dumbbell Press": { muscle: "Upper Chest", swaps: ["Incline Barbell Press", "Incline Smith Press", "Cable Upper Chest Fly"] },
  "Cable Fly / Pec Deck": { muscle: "Chest", swaps: ["Dumbbell Fly", "Resistance Band Fly", "Push-Up Plus"] },
  "Close-Grip Bench Press": { muscle: "Triceps", swaps: ["Diamond Push-Ups", "EZ Bar Tricep Press", "Dip Machine"] },
  "Overhead Tricep Extension": { muscle: "Triceps", swaps: ["Cable Overhead Extension", "Dumbbell Kickback", "Resistance Band Overhead"] },
  "Tricep Pushdown": { muscle: "Triceps", swaps: ["Dumbbell Kickback", "Bench Dips", "Cable V-Bar Pushdown"] },
  "Barbell / Dumbbell Row": { muscle: "Back", swaps: ["T-Bar Row", "Machine Row", "Cable Row", "Resistance Band Row"] },
  "Lat Pulldown": { muscle: "Back", swaps: ["Pull-Ups / Chin-Ups", "Resistance Band Pulldown", "Straight-Arm Pushdown"] },
  "Cable Row (Seated)": { muscle: "Mid Back", swaps: ["Machine Row", "Dumbbell Row", "Band Row"] },
  "Face Pulls": { muscle: "Rear Delt", swaps: ["Band Pull-Aparts", "Reverse Pec Deck", "DB Rear Delt Fly"] },
  "Barbell / EZ Bar Curl": { muscle: "Biceps", swaps: ["Dumbbell Curl", "Cable Curl", "Resistance Band Curl"] },
  "Hammer Curl": { muscle: "Brachialis", swaps: ["Rope Cable Curl", "Cross-Body Curl", "Neutral Grip DB Curl"] },
  "Incline Dumbbell Curl": { muscle: "Biceps", swaps: ["Spider Curl", "Cable Incline Curl", "Concentration Curl"] },
  "Goblet Squat": { muscle: "Quads", swaps: ["Leg Press", "Hack Squat", "Bulgarian Split Squat", "Box Squat"] },
  "Walking Lunges": { muscle: "Quads/Glutes", swaps: ["Reverse Lunges", "Step-Ups", "Split Squat", "Leg Press"] },
  "Romanian Deadlift": { muscle: "Hamstrings", swaps: ["Leg Curl (Machine)", "Good Mornings", "Nordic Curl", "Swiss Ball Curl"] },
  "Leg Press": { muscle: "Quads", swaps: ["Goblet Squat", "Hack Squat", "Step-Ups"] },
  "Seated DB Shoulder Press": { muscle: "Shoulders", swaps: ["Barbell OHP", "Machine Press", "Arnold Press", "Cable Overhead Press"] },
  "Lateral Raises": { muscle: "Side Delt", swaps: ["Cable Lateral Raise", "Band Lateral Raise", "Machine Lateral Raise"] },
  "Rear Delt Fly": { muscle: "Rear Delt", swaps: ["Cable Rear Fly", "Face Pulls", "Band Pull-Apart"] },
  "EZ Bar Preacher Curl": { muscle: "Biceps", swaps: ["Machine Preacher Curl", "Cable Curl", "Concentration Curl"] },
  "Cable Curl": { muscle: "Biceps", swaps: ["Dumbbell Curl", "Band Curl", "Machine Curl"] },
  "Skull Crushers": { muscle: "Triceps", swaps: ["EZ Bar Extension", "DB Skull Crusher", "Cable Overhead Extension"] },
  "Dips (weighted if able)": { muscle: "Triceps", swaps: ["Bench Dips", "Dip Machine", "Close-Grip Push-Ups"] },
  "Hanging Knee Raises": { muscle: "Lower Abs", swaps: ["Captain's Chair Knee Raise", "Lying Leg Raise", "Reverse Crunch"] },
  "Cable Crunches": { muscle: "Abs", swaps: ["Crunch Machine", "Weighted Sit-Up", "Ab Wheel Rollout"] },
  "Plank": { muscle: "Core", swaps: ["Dead Bug", "Bear Crawl Hold", "RKC Plank"] },
  "Side Extension / Side Plank": { muscle: "Obliques", swaps: ["Side Plank Hip Dip", "Pallof Press", "Band Side Bend"] },
  "Incline Walk": { muscle: "Cardio", swaps: ["Stair Climber", "Stationary Bike", "Elliptical", "Brisk Walk Outdoors"] },
  "Sled Push / Battle Ropes": { muscle: "Conditioning", swaps: ["Kettlebell Swings", "Box Jumps", "Rowing Machine Intervals", "Burpees"] },
  "Kettlebell Swings": { muscle: "Conditioning", swaps: ["Romanian Deadlift High Pull", "Jump Rope", "Dumbbell Swing"] },
  "Jump Rope": { muscle: "Cardio", swaps: ["Box Step-Ups fast pace", "Jumping Jacks", "High Knees", "Stair Climber"] },
};

export const WORKOUT_PLAN = [
  { id: 1, name: "Chest + Triceps", emoji: "💪", duration: "60–70 min",
    exercises: [
      { name: "Flat Barbell Bench Press", sets: 4, reps: "6–8", note: "Primary strength driver" },
      { name: "Incline Dumbbell Press", sets: 3, reps: "10–12", note: "Upper chest" },
      { name: "Cable Fly / Pec Deck", sets: 3, reps: "12–15", note: "Stretch focus" },
      { name: "Close-Grip Bench Press", sets: 3, reps: "8–10", note: "Tricep overload" },
      { name: "Overhead Tricep Extension", sets: 3, reps: "10–12", note: "Long head stretch" },
      { name: "Tricep Pushdown", sets: 3, reps: "12–15", note: "Finisher" },
    ], cardio: "20–25 min incline walk @ 130–145 bpm" },
  { id: 2, name: "Back + Biceps", emoji: "🏋️", duration: "65–75 min",
    exercises: [
      { name: "Barbell / Dumbbell Row", sets: 4, reps: "6–8", note: "Horizontal pull" },
      { name: "Lat Pulldown", sets: 3, reps: "10–12", note: "Width builder" },
      { name: "Cable Row (Seated)", sets: 3, reps: "10–12", note: "Mid-back thickness" },
      { name: "Face Pulls", sets: 3, reps: "15–20", note: "Rear delt health" },
      { name: "Barbell / EZ Bar Curl", sets: 3, reps: "8–10", note: "Primary bicep" },
      { name: "Hammer Curl", sets: 3, reps: "10–12", note: "Brachialis" },
      { name: "Incline Dumbbell Curl", sets: 2, reps: "12–15", note: "Long head" },
    ], cardio: "20–25 min incline walk @ 130–145 bpm" },
  { id: 3, name: "Legs + Shoulders", emoji: "🦵", duration: "70–80 min",
    exercises: [
      { name: "Goblet Squat", sets: 4, reps: "10–12", note: "QL-safe" },
      { name: "Walking Lunges", sets: 3, reps: "12/leg", note: "Unilateral + glute" },
      { name: "Romanian Deadlift", sets: 3, reps: "10–12", note: "Monitor QL" },
      { name: "Leg Press", sets: 3, reps: "12–15", note: "Low spinal load" },
      { name: "Seated DB Shoulder Press", sets: 4, reps: "8–10", note: "Primary shoulder" },
      { name: "Lateral Raises", sets: 3, reps: "15–20", note: "V-taper width" },
      { name: "Rear Delt Fly", sets: 3, reps: "15–20", note: "3D shoulder" },
    ], cardio: "15–20 min incline walk" },
  { id: 4, name: "Arms + Core", emoji: "🎯", duration: "55–65 min",
    exercises: [
      { name: "EZ Bar Preacher Curl", sets: 3, reps: "10–12", note: "Peak contraction" },
      { name: "Cable Curl", sets: 3, reps: "12–15", note: "Constant tension" },
      { name: "Skull Crushers", sets: 3, reps: "10–12", note: "Tricep mass" },
      { name: "Dips (weighted if able)", sets: 3, reps: "8–12", note: "Tricep + chest" },
      { name: "Hanging Knee Raises", sets: 3, reps: "15–20", note: "Lower abs" },
      { name: "Cable Crunches", sets: 3, reps: "15–20", note: "Weighted abs" },
      { name: "Plank", sets: 3, reps: "30–45 sec", note: "Core stability" },
      { name: "Side Extension / Side Plank", sets: 2, reps: "30 sec/side", note: "Oblique + QL" },
    ], cardio: "25–30 min incline walk" },
  { id: 5, name: "Conditioning", emoji: "⚡", duration: "30–45 min", optional: true,
    exercises: [
      { name: "Incline Walk", sets: 1, reps: "30–40 min", note: "Steady state" },
      { name: "Sled Push / Battle Ropes", sets: 5, reps: "30s on/30s off", note: "If available" },
      { name: "Kettlebell Swings", sets: 4, reps: "15–20", note: "Posterior + cardio" },
      { name: "Jump Rope", sets: 5, reps: "2 min rounds", note: "Low impact" },
    ], cardio: "This IS the cardio day" },
];

export const GOALS = [
  { id: "bali", label: "Bali Trip", icon: "🏖️", targetWeight: 86, targetBF: 17.5, deadline: "2026-08-20", color: "#3BFFAE" },
  { id: "longterm", label: "Long-Term Physique", icon: "🏆", targetWeight: 83, targetBF: 15, deadline: "2027-01-01", color: "#4DA6FF" },
];

export const TABS = ["Today", "Log Workout", "Log Nutrition", "History", "Plan", "Goals", "Coach"];

export function todayStr() { return new Date().toISOString().split("T")[0]; }
