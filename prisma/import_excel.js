const XLSX = require('xlsx');
const { Client } = require('pg');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const client = new Client({
    connectionString: process.env.DATABASE_URL,
});

async function main() {
    await client.connect();
    console.log('Connected to DB');

    // Clear existing data
    await client.query('TRUNCATE TABLE workout_exercises, workouts, exercises, scheduled_workouts, exercise_logs, complex_logs, programs RESTART IDENTITY CASCADE;');

    const workbook = XLSX.readFile(path.join(__dirname, '../../Spartan_Elite_Complete_Program.xlsx'));

    const sheetMap = {
        'DAY 1 - MON': 1,
        'DAY 2 - TUE': 2,
        'DAY 3 - WED': 3,
        'DAY 4 - THU': 4,
        'DAY 5 - FRI': 5,
        'DAY 6 - SAT': 6,
        'DAY 7 - SUN': 7,
    };

    const allSeedData = {
        program: {
            name: 'Spartan Elite',
            description: '6-Week Performance Block',
            duration_weeks: 6
        },
        workouts: []
    };

    for (const [sheetName, dayId] of Object.entries(sheetMap)) {
        if (!workbook.Sheets[sheetName]) {
            console.log(`Skipping ${sheetName} (not found)`);
            continue;
        }
        console.log(`Processing ${sheetName}...`);

        const sheet = workbook.Sheets[sheetName];
        const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        // Find header row (row containing 'Exercise')
        let headerRowIdx = -1;
        for (let i = 0; i < rawData.length; i++) {
            if (!rawData[i]) continue;
            const rowStr = rawData[i].map(c => String(c || '')).join(' ').toUpperCase();
            if (rowStr.includes('EXERCISE')) {
                headerRowIdx = i;
                break;
            }
        }

        if (headerRowIdx === -1) {
            console.warn(`Could not find header for ${sheetName}`);
            continue;
        }

        // Column Mapping
        const headerRow = rawData[headerRowIdx];
        const colMap = {};
        headerRow.forEach((col, idx) => {
            const c = String(col).toUpperCase();
            if (c.includes('EXERCISE')) colMap.exercise = idx;
            else if (c.includes('SETS')) colMap.sets = idx;
            else if (c.includes('REPS')) colMap.reps = idx;
            else if (c.includes('REST')) colMap.rest = idx;
            else if (c.includes('NOTES')) colMap.notes = idx;
        });

        // Find FOCUS column dynamically
        const focusIdx = headerRow.findIndex(h => String(h || '').toUpperCase().includes('FOCUS'));

        let currentSection = "Main Workout";
        let orderCounter = 1;

        // Data Extraction for Seed File
        const workoutData = {
            title: (rawData[0] && rawData[0][0]) || sheetName,
            day_of_week: dayId,
            description: `Workout for ${sheetName}`,
            estimated_duration: '60-90 min',
            exercises: []
        };
        allSeedData.workouts.push(workoutData);

        // Process Rows
        for (let i = headerRowIdx + 1; i < rawData.length; i++) {
            const row = rawData[i];
            if (!row || row.length === 0) continue;

            const exName = (row[colMap.exercise] || '').toString().trim();
            if (!exName) continue;

            const numberPrefixRegex = /^(\d+[A-Z]?|\d+)\.\s*/i;
            const setsVal = (row[colMap.sets] || '').toString();
            const repsVal = (row[colMap.reps] || '').toString();

            // SECTION HEADER DETECTION
            if (!setsVal && !repsVal) {
                currentSection = exName;
                continue;
            }

            // GROUPING LOGIC (Persistent)
            let groupLabel = null;
            // 1. Try to extract "A" from "A. Strength" in currentSection
            const sectionGroupMatch = currentSection.match(/^([A-Z])\.\s+/);
            if (sectionGroupMatch) {
                groupLabel = sectionGroupMatch[1]; // "A"
            }
            // 2. Override if exercise name has "1A"
            const prefixMatch = exName.match(numberPrefixRegex);
            if (prefixMatch) {
                const prefix = prefixMatch[1];
                const letterMatch = prefix.match(/[A-Z]/);
                if (letterMatch) groupLabel = letterMatch[0];
            }
            // 3. Finisher check
            if (currentSection.toUpperCase().includes('FINISHER')) groupLabel = 'Finisher';

            // CLEAN NAME
            const cleanedExName = exName.replace(numberPrefixRegex, '').trim();
            if (!cleanedExName) continue;

            // CATEGORY & FLAGS
            let category = 'strength';
            if (cleanedExName.includes('Cur') || cleanedExName.includes('Ext')) category = 'hypertrophy';

            const isComplex = currentSection.toUpperCase().includes('COMPLEX');
            const isCircuit = currentSection.toUpperCase().includes('CIRCUIT') || currentSection.toUpperCase().includes('FINISHER');

            if (isComplex || isCircuit) category = isComplex ? 'complex' : 'circuit';
            if (sheetName.includes('DAY 7')) category = 'recovery';

            const notesVal = (row[colMap.notes] || '').toString();
            const focusVal = focusIdx > -1 ? (row[focusIdx] || '').toString() : null;

            // Add to Memory for JSON Export
            workoutData.exercises.push({
                name: cleanedExName,
                category,
                section_label: currentSection,
                group_label: groupLabel,
                order: orderCounter++,
                sets: setsVal,
                reps: repsVal,
                rest_period: (row[colMap.rest] || '').toString(),
                notes: notesVal,
                focus: focusVal,
                is_complex: isComplex,
                is_circuit: isCircuit,
                complex_name: (isComplex || isCircuit) ? currentSection : ''
            });
        }
    }

    // WRITE TO JSON
    fs.writeFileSync(path.join(__dirname, 'seed_data.json'), JSON.stringify(allSeedData, null, 2));
    console.log('Seed data extracted to seed_data.json');

    // INSERT INTO DB
    await client.query(`
        INSERT INTO programs (name, description, duration_weeks, updated_at, created_at)
        VALUES ($1, $2, $3, NOW(), NOW())
        ON CONFLICT (name) DO NOTHING
    `, [allSeedData.program.name, allSeedData.program.description, allSeedData.program.duration_weeks]);

    // Get ID
    const progIdRes = await client.query(`SELECT id FROM programs WHERE name = $1`, [allSeedData.program.name]);
    const programId = progIdRes.rows[0].id;

    for (const w of allSeedData.workouts) {
        const workoutRes = await client.query(`
            INSERT INTO workouts (title, day_of_week, description, estimated_duration, program_id, updated_at, created_at)
            VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
            RETURNING id;
        `, [w.title, w.day_of_week, w.description, w.estimated_duration, programId]);
        const workoutId = workoutRes.rows[0].id;

        for (const ex of w.exercises) {
            // Exercise
            let exerciseId;
            const newEx = await client.query(`
                INSERT INTO exercises (name, category, muscle_group, equipment, source, updated_at, created_at)
                VALUES ($1, $2, 'General', 'Gym', 'spreadsheet', NOW(), NOW())
                ON CONFLICT (name) DO NOTHING RETURNING id;
            `, [ex.name, ex.category]);
            if (newEx.rows.length > 0) exerciseId = newEx.rows[0].id;
            else {
                const existing = await client.query(`SELECT id FROM exercises WHERE name = $1`, [ex.name]);
                exerciseId = existing.rows[0].id;
            }

            // Workout Exercise
            await client.query(`
                INSERT INTO workout_exercises (
                    workout_id, exercise_id, section_label, group_label, "order", 
                    sets, reps, rest_period, notes, focus, is_complex, is_circuit, complex_name
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13);
            `, [
                workoutId, exerciseId, ex.section_label, ex.group_label, ex.order,
                ex.sets, ex.reps, ex.rest_period, ex.notes, ex.focus,
                ex.is_complex, ex.is_circuit, ex.complex_name
            ]);
        }
    }

    console.log('Import finished successfully.');
    await client.end();
}

main().catch(e => {
    console.error(e);
    process.exit(1);
});
