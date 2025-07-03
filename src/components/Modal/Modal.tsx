"use client";

import { XMarkIcon } from "@heroicons/react/24/outline";
import { motion } from "framer-motion";
import { Text } from "../Typography/Typography";

import {
  useState,
  forwardRef,
  type ForwardedRef,
  useImperativeHandle,
  Children,
  isValidElement,
  type ReactElement,
  useEffect,
} from "react";

const slideInVariants = {
  initial: { opacity: 0, y: "100%" },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: "100%" },
};

const slideOutVariants = {
  initial: { opacity: 0, y: 0 },
  animate: { opacity: 1, y: "100%" },
  exit: { opacity: 0, y: "100%" },
};

type ModalProps = {
  className?: string;
  children: React.ReactNode;
  withCloseButton?: boolean;
  title?: string;
  bottomContent?: React.ReactNode;
};

export type ModalRefProps = {
  openModal: () => void;
  closeModal: () => void;
  isOpen: boolean;
};

// Compound components
const ModalContent = ({
  children,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return <>{children}</>;
};

const ModalBottom = ({
  children,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return <>{children}</>;
};

const ModalTitle = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

type ModalComponent = React.ForwardRefExoticComponent<
  ModalProps & React.RefAttributes<ModalRefProps>
> & {
  Content: typeof ModalContent;
  Bottom: typeof ModalBottom;
  Title: typeof ModalTitle;
};

const Modal = forwardRef<ModalRefProps, ModalProps>(
  (
    {
      children,
      withCloseButton = true,
      className,
      title,
      bottomContent,
    }: ModalProps,
    ref: ForwardedRef<ModalRefProps>
  ) => {
    const [showDrawer, setShowDrawer] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);

    const handleCloseLocally = () => {
      setIsAnimating(false);
      setTimeout(() => setShowDrawer(false), 200);
    };

    useImperativeHandle(ref, () => ({
      openModal: () => {
        setShowDrawer(true);
        setTimeout(() => setIsAnimating(true));
      },
      closeModal: () => {
        handleCloseLocally();
      },
      isOpen: showDrawer,
    }));

    // Add escape key listener
    useEffect(() => {
      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === "Escape") {
          handleCloseLocally();
        }
      };

      if (showDrawer) {
        document.addEventListener("keydown", handleKeyDown);
      }

      return () => {
        document.removeEventListener("keydown", handleKeyDown);
      };
    }, [showDrawer]);

    // Extract compound components from children
    let modalTitle: React.ReactNode = title;
    let modalContent: React.ReactNode = null;
    let modalBottom: React.ReactNode = bottomContent;
    let modalContentClassName: string | undefined = undefined;
    let modalBottomClassName: string | undefined = undefined;

    Children.forEach(children, (child) => {
      if (isValidElement(child)) {
        const childElement = child as ReactElement<{
          children: React.ReactNode;
          className?: string;
        }>;
        if (childElement.type === ModalTitle) {
          modalTitle = childElement.props.children;
        } else if (childElement.type === ModalContent) {
          modalContent = childElement.props.children;
          modalContentClassName = childElement.props.className;
        } else if (childElement.type === ModalBottom) {
          modalBottom = childElement.props.children;
          modalBottomClassName = childElement.props.className;
        }
      }
    });

    // If no compound components found, treat children as content (backward compatibility)
    if (!modalContent && !modalBottom && modalTitle === title) {
      modalContent = children;
    }

    return showDrawer ? (
      <div className="fixed bottom-0 left-0 top-0 z-50 flex h-screen w-screen items-center justify-center overflow-hidden">
        <div
          className="absolute h-full w-full bg-black/70 backdrop-blur-2xl backdrop-saturate-150 backdrop-brightness-50"
          onClick={handleCloseLocally}
        />

        <motion.main
          initial={isAnimating ? "initial" : "exit"}
          animate={isAnimating ? "animate" : "exit"}
          exit="exit"
          variants={isAnimating ? slideInVariants : slideOutVariants}
          transition={{ duration: 0.2, type: "spring" }}
          className={`mobile:max-w-[320px] relative z-20 box-border flex flex-col min-h-[150px] rounded-lg desktop:min-h-[250px] desktop:min-w-[300px] max-h-[90vh] ${
            className || "bg-white"
          }`}
        >
          {withCloseButton && (
            <XMarkIcon
              onClick={handleCloseLocally}
              className="absolute z-30 right-4 top-8 w-10 h-10 box-border cursor-pointer p-2 text-dark-secondary"
            />
          )}

          {modalTitle && (
            <div className="pt-10 pb-4 px-6">
              <Text variant="h6" className="text-neutral-900 font-semibold">
                {modalTitle}
              </Text>
            </div>
          )}

          <div
            className={`${modalTitle ? "mt-10" : "pt-10"} px-6 overflow-hidden min-w-[30rem] ${modalContentClassName || ""}`}
          >
            {modalContent}
          </div>

          {modalBottom && (
            <div className={`pt-10 pb-4 px-6 ${modalBottomClassName || ""}`}>
              {modalBottom}
            </div>
          )}
        </motion.main>
      </div>
    ) : null;
  }
) as ModalComponent;

Modal.displayName = "Modal";
Modal.Content = ModalContent;
Modal.Bottom = ModalBottom;
Modal.Title = ModalTitle;

export { Modal };
