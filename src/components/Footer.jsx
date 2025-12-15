import React from 'react';

const Footer = () => {
    return (
        <footer className="bg-black border-t border-zinc-800 py-6 px-8 mt-auto">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-zinc-500">
                <p className="font-medium">© 2026 Government Graduate College Aroop. All rights reserved.</p>
                <div className="flex gap-6">
                    <span className="hover:text-zinc-300 transition-colors cursor-default">FYP Batch 2022-2026</span>
                    <span className="hover:text-zinc-300 transition-colors cursor-default">Department of Computer Science</span>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
