
import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { Server } from "socket.io";
import { PrismaClient } from "@prisma/client";

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = 3000;
// when using middleware `hostname` and `port` must be provided below
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

const prisma = new PrismaClient();

app.prepare().then(() => {
    const httpServer = createServer((req, res) => {
        const parsedUrl = parse(req.url!, true);
        handle(req, res, parsedUrl);
    });

    const io = new Server(httpServer);

    io.on("connection", (socket) => {
        console.log("Client connected:", socket.id);

        socket.on("join_wheel", (slug) => {
            const room = `wheel_${slug}`;
            socket.join(room);
            console.log(`Socket ${socket.id} joined ${room}`);
        });

        socket.on("spin", async (data: { slug: string }) => {
            try {
                const { slug } = data;
                if (!slug) {
                    socket.emit("spin_result", { success: false, error: 'Wheel slug required' });
                    return;
                }

                console.log(`Spin request received for wheel: ${slug}`);

                // Transaction logic for spin
                const result = await prisma.$transaction(async (tx) => {
                    // First find the wheel to ensure it exists and is enabled
                    const wheel = await tx.wheel.findUnique({
                        where: { slug }
                    });

                    if (!wheel) {
                        throw new Error('Wheel not found'); // Caught below
                    }
                    if (!wheel.isEnabled) {
                        throw new Error('Wheel is currently disabled');
                    }

                    const segments = await tx.segment.findMany({
                        where: {
                            wheelId: wheel.id,
                            stock: { gt: 0 }
                        },
                    });

                    if (segments.length === 0) {
                        return { success: false, error: 'No prizes available!' };
                    }

                    const totalWeight = segments.reduce((acc, seg) => acc + seg.probability, 0);
                    let random = Math.random() * totalWeight;
                    let winner = segments[0];

                    for (const seg of segments) {
                        if (random < seg.probability) {
                            winner = seg;
                            break;
                        }
                        random -= seg.probability;
                    }

                    // Atomic decrement
                    const updateCount = await tx.segment.updateMany({
                        where: { id: winner.id, stock: { gt: 0 } },
                        data: { stock: { decrement: 1 } },
                    });

                    if (updateCount.count === 0) {
                        throw new Error('Race condition - retrying');
                    }

                    const winLog = await tx.winLog.create({
                        data: {
                            segmentId: winner.id,
                            wheelId: wheel.id
                        },
                    });

                    return { success: true, segment: winner, winLogId: winLog.id, wheelId: wheel.id };
                });

                if (result.success) {
                    // Emit success to THIS client
                    socket.emit("spin_result", result);

                    // Broadcast update to ALL clients in the wheel room
                    const updatedSegment = await prisma.segment.findUnique({ where: { id: result.segment!.id } });
                    if (updatedSegment) {
                        io.to(`wheel_${slug}`).emit("segment_update", updatedSegment);
                    }

                    // Also emit a "winner_announced" event to admin room? Or just rely on segment update.
                    // For now, segment update is key for UI.
                } else {
                    socket.emit("spin_result", result);
                }

            } catch (e: any) {
                console.error("Spin error:", e);
                socket.emit("spin_result", { success: false, error: e.message || 'Spin failed' });
            }
        });

        socket.on("disconnect", () => {
            console.log("Client disconnected:", socket.id);
        });
    });

    // Internal endpoint/method to trigger updates from Admin actions?
    // We can just watch the DB? No, MySQL doesn't have native easy realtime streams like Postgres without heavy setup.
    // Simplest way: When Admin updates data via API, that API also emits to Socket.
    // But usage of 'server.ts' makes it hard to import `io` in Next.js API routes universally.
    // Alternative: Admin clients ALSO use socket to update settings? 
    // OR: We create a simple HTTP endpoint on this express server that Next.js Server Actions call to query broadcast.
    // For now, let's just leave Basic "Spin" logic. 
    // If user updates segments in Admin (Next.js Server Actions), we need those to reflect.
    // We can add a simple valid-token protected REST endpoint on this server instance that triggers emission.

    // Let's add that for completeness if needed. But for now, focusing on Wheel spin.

    httpServer.once("error", (err) => {
        console.error(err);
        process.exit(1);
    });

    httpServer.listen(port, () => {
        console.log(`> Ready on http://${hostname}:${port}`);
    });
});
