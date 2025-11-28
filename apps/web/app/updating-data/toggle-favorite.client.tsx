"use client";
import { useOptimistic, useTransition } from "react";
import { toast } from "sonner";
import { toggleFavorite } from "./toggle-favorite.action";

const useToggleFavorite = (postId: string, isFavorite: boolean) => {
  const [isPending, startTransition] = useTransition();
  const [optimisticFavorite, setOptimisticFavorite] = useOptimistic(
    isFavorite,
    (_currentState, _: void) => {
      return !_currentState;
    }
  );

  const handleToggle = async () => {
    startTransition(async () => {
      setOptimisticFavorite();

      const result = await toggleFavorite(postId);
      if (result.ok === 1) {
        toast.success(result.message);
      } else {
        toast.error(result.error);
      }
    });
  };

  return {
    currentFavorite: optimisticFavorite,
    isPending,
    handleToggle,
  };
};

export const ToggleFavorite = ({
  postId,
  isFavorite,
}: {
  postId: string;
  isFavorite: boolean;
}) => {
  const { handleToggle, currentFavorite } = useToggleFavorite(
    postId,
    isFavorite
  );
  return (
    <div>
      <p>Is Favorite: {currentFavorite ? "Yes" : "No"}</p>
      <button onClick={handleToggle}>Toggle Favorite</button>
    </div>
  );
};
