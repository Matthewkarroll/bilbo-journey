from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List

app = FastAPI()

# ALLOW CORS (Fixes connection errors)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 1. THE MAP: Bilbo's journey defined as Legs
journey_legs = [
    {"id": 0, "name": "Bag End", "distance_from_start_miles": 0, "leg_distance": 0},
    {"id": 1, "name": "Rivendell", "distance_from_start_miles": 397, "leg_distance": 397},
    {"id": 2, "name": "Misty Mountains (Goblins)", "distance_from_start_miles": 500, "leg_distance": 103},
    {"id": 3, "name": "Mirkwood (Gandalf Leaves)", "distance_from_start_miles": 600, "leg_distance": 100},
    {"id": 4, "name": "Lake Town", "distance_from_start_miles": 750, "leg_distance": 150},
    {"id": 5, "name": "The Lonely Mountain", "distance_from_start_miles": 967, "leg_distance": 217},
]

# 2. THE STATE: Tracking where the user is
current_leg_index = 0
total_miles_traveled = 0
xp = 0  # XP starts at 0
is_round_trip = False
journey_complete = False

# 3. DATA MODEL: What the user sends us
class TravelInput(BaseModel):
    miles_walked: int = 10
    trip_type: str = "one_way"

@app.get("/")
def get_current_status():
    global current_leg_index, total_miles_traveled, journey_complete
    if journey_complete:
        return {"message": "Journey Complete! There and Back Again!", "milestone": "Home"}
    
    current_leg = journey_legs[current_leg_index]
    return {
        "current_location": current_leg["name"],
        "miles_traveled": total_miles_traveled,
        "percent_complete": round((total_miles_traveled / 967) * 100, 1) if not is_round_trip else round((total_miles_traveled / 1934) * 100, 1),
        "next_milestone": journey_legs[current_leg_index + 1]["name"] if current_leg_index < len(journey_legs) - 1 else "The End",
        "daily_update": "On the road again!",
        "xp": round(xp, 1)  # Send XP to the website
    }

@app.post("/walk")
def walk(input_data: TravelInput):
    global current_leg_index, total_miles_traveled, journey_complete, is_round_trip, xp
    
    is_round_trip = (input_data.trip_type == "round_trip")
    total_goal = 1934 if is_round_trip else 967
    
    total_miles_traveled += input_data.miles_walked
    
    # XP MATH: 1 mile = 1609 meters. 100 meters = 10 XP.
    # So 1 mile = (1609 / 100) * 10 = 160.9 XP
    xp += input_data.miles_walked * 160.9
    
    if total_miles_traveled >= total_goal:
        total_miles_traveled = total_goal
        journey_complete = True
        return {
            "milestone_popped": "Mountain's Throne!",
            "message": "You have completed the entire journey! Middle-earth awaits!",
            "miles_walked": input_data.miles_walked
        }
    
    new_leg_index = 0
    for i, leg in enumerate(journey_legs):
        if total_miles_traveled >= leg["distance_from_start_miles"]:
            new_leg_index = i
            
    milestone_popped = None
    if new_leg_index > current_leg_index:
        milestone_popped = journey_legs[new_leg_index]["name"]
        current_leg_index = new_leg_index
        if current_leg_index == len(journey_legs) - 1 and is_round_trip:
            milestone_popped += " (You are now returning home!)"
            
    return {
        "milestone_popped": milestone_popped,
        "current_location": journey_legs[current_leg_index]["name"],
        "miles_walked": input_data.miles_walked,
        "percent_complete": round((total_miles_traveled / total_goal) * 100, 1),
        "xp": round(xp, 1)
    }

@app.post("/reset")
def reset_journey():
    global current_leg_index, total_miles_traveled, journey_complete, xp
    current_leg_index = 0
    total_miles_traveled = 0
    xp = 0  # Reset XP back to zero
    journey_complete = False
    return {"message": "The journey has been reset to Bag End."}