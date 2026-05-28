import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NotificationsContext } from "../contexts/NotificationsProvider";
import ToastNotification from "./ToastNotification";

const renderToast = (notifications = [], dismiss = vi.fn()) => {
  return render(
    <NotificationsContext.Provider value={{ notifications, dismiss }}>
      <ToastNotification />
    </NotificationsContext.Provider>
  );
};

describe("ToastNotification", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders nothing when there are no notifications", () => {
    const { container } = renderToast([]);
    expect(container.innerHTML).toBe("");
  });

  it("renders a toast for each notification", () => {
    const notifications = [
      { id: "1", itemTitle: "Golf Day", newHighestBid: 50, currency: "£" },
      { id: "2", itemTitle: "Spa Voucher", newHighestBid: 30, currency: "£" },
    ];

    renderToast(notifications);

    expect(screen.getByText(/Golf Day/)).toBeInTheDocument();
    expect(screen.getByText(/Spa Voucher/)).toBeInTheDocument();
  });

  it("displays item title and new highest bid in toast body", () => {
    const notifications = [
      { id: "1", itemTitle: "Golf Day", newHighestBid: 50, currency: "£" },
    ];

    renderToast(notifications);

    expect(
      screen.getByText(/You've been outbid on Golf Day/)
    ).toBeInTheDocument();
    expect(screen.getByText(/New highest bid: £50/)).toBeInTheDocument();
  });

  it("calls dismiss when close button is clicked", () => {
    const dismiss = vi.fn();
    const notifications = [
      { id: "1", itemTitle: "Golf Day", newHighestBid: 50, currency: "£" },
    ];

    renderToast(notifications, dismiss);

    const closeButton = screen.getByRole("button", { name: /close/i });
    fireEvent.click(closeButton);

    expect(dismiss).toHaveBeenCalledWith("1");
  });

  it("auto-dismisses after 5 seconds", () => {
    const dismiss = vi.fn();
    const notifications = [
      { id: "1", itemTitle: "Golf Day", newHighestBid: 50, currency: "£" },
    ];

    renderToast(notifications, dismiss);

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(dismiss).toHaveBeenCalledWith("1");
  });

  it("does not dismiss before 5 seconds", () => {
    const dismiss = vi.fn();
    const notifications = [
      { id: "1", itemTitle: "Golf Day", newHighestBid: 50, currency: "£" },
    ];

    renderToast(notifications, dismiss);

    act(() => {
      vi.advanceTimersByTime(4999);
    });

    expect(dismiss).not.toHaveBeenCalled();
  });

  it("uses Bootstrap toast classes", () => {
    const notifications = [
      { id: "1", itemTitle: "Golf Day", newHighestBid: 50, currency: "£" },
    ];

    renderToast(notifications);

    const toast = screen.getByRole("alert");
    expect(toast).toHaveClass("toast", "show");

    const header = toast.querySelector(".toast-header");
    expect(header).toBeInTheDocument();

    const body = toast.querySelector(".toast-body");
    expect(body).toBeInTheDocument();
  });

  it("positions the container fixed at top-right", () => {
    const notifications = [
      { id: "1", itemTitle: "Golf Day", newHighestBid: 50, currency: "£" },
    ];

    const { container } = renderToast(notifications);

    const toastContainer = container.firstChild;
    expect(toastContainer).toHaveClass("position-fixed", "top-0", "end-0");
  });
});
