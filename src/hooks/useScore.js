import { create } from "zustand";
import { createScoreByReferee } from "../api/scoreApi";

const useScore = create((set, get) => ({
  createScore: async (registrationId, roundId, isPass) => {
    try {
      const res = await createScoreByReferee(registrationId, roundId, isPass);
      console.log("API Response when creating score:", res);
      if (res && res.status === 201) {
        return res.data || { message: "Score created successfully" };
      } else {
        console.error("API Error:", res);
        return null;
      }
    } catch (error) {
      console.error("API Error:", error);
      return null;
    }
  },
}));

export default useScore;
